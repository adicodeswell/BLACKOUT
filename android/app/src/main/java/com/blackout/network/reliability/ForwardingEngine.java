package com.blackout.network.reliability;

import android.util.Log;

import com.blackout.geolocation.OfflineGeoEngine;
import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.transport.OutgoingSendManager;

import java.util.ArrayList;
import java.util.List;

/**
 * Evaluates incoming messages to decide if we should forward them
 * deeper into the mesh network.
 */
public class ForwardingEngine {
    private static final String TAG = "ForwardingEngine";
    
    private final String localDeviceId;
    private final OutgoingSendManager sendManager;
    private final MessageDeduplicator deduplicator;
    private com.blackout.data.RoomDataEngine dataEngine;
    private OfflineGeoEngine geoEngine;
    private final java.util.Set<String> localAliases = java.util.Collections.newSetFromMap(new java.util.concurrent.ConcurrentHashMap<String, Boolean>());

    public ForwardingEngine(String localDeviceId, OutgoingSendManager sendManager, MessageDeduplicator deduplicator) {
        this.localDeviceId = localDeviceId;
        this.sendManager = sendManager;
        this.deduplicator = deduplicator;
    }

    public ForwardingEngine(String localDeviceId, OutgoingSendManager sendManager, MessageDeduplicator deduplicator, OfflineGeoEngine geoEngine) {
        this.localDeviceId = localDeviceId;
        this.sendManager = sendManager;
        this.deduplicator = deduplicator;
        this.geoEngine = geoEngine;
    }

    public void addLocalAlias(String alias) {
        if (alias != null && !alias.isEmpty()) {
            localAliases.add(alias);
            localAliases.add(alias.toLowerCase());
            localAliases.add(alias.toUpperCase());
        }
    }

    public boolean isLocalDestination(String id) {
        if (id == null || id.isEmpty()) return false;
        if (localDeviceId != null && id.equalsIgnoreCase(localDeviceId)) return true;
        return localAliases.contains(id) || localAliases.contains(id.toLowerCase()) || localAliases.contains(id.toUpperCase());
    }

    public void setGeoEngine(OfflineGeoEngine geoEngine) {
        this.geoEngine = geoEngine;
    }

    public OfflineGeoEngine getGeoEngine() {
        return this.geoEngine;
    }

    public void setDataEngine(com.blackout.data.RoomDataEngine dataEngine) {
        this.dataEngine = dataEngine;
    }

    /**
     * Determines if a message qualifies for store-and-forward.
     */
    public boolean shouldForward(NetworkMessage msg) {
        if (msg == null) return false;

        // 1. Don't forward our own messages back out
        if (msg.getOriginDeviceId() != null && isLocalDestination(msg.getOriginDeviceId())) return false;
        
        // 2. TTL (Time To Live) exceeded, drop it to prevent infinite loops
        if (msg.getHopCount() >= msg.getTtl()) {
            Log.d(TAG, "Message TTL exceeded (" + msg.getHopCount() + "/" + msg.getTtl() + "), dropping: " + msg.getMessageId());
            return false;
        }
        
        // 3. If it was specifically for us (UUID or local MAC/transport alias), we don't need to forward it further
        if (isLocalDestination(msg.getDestinationDeviceId())) return false;

        return true;
    }

    public void forwardMessage(NetworkMessage msg) {
        forwardMessage(msg, null);
    }

    /**
     * Rebuilds the message with an incremented hop count and relays it via direct socket
     * or split-horizon broadcast (excluding the node that sent it to us).
     */
    public void forwardMessage(NetworkMessage msg, String sourcePeerId) {
        if (!shouldForward(msg)) return;

        // Remember it so WE don't process it again if it bounces back
        deduplicator.recordMessage(msg.getMessageId());

        // Create a strict immutable copy with +1 hop count
        NetworkMessage forwardedMsg = new NetworkMessage.Builder()
                .protocolVersion(msg.getProtocolVersion())
                .messageId(msg.getMessageId()) // Crucial: ID stays exactly the same
                .originDeviceId(msg.getOriginDeviceId())
                .destinationDeviceId(msg.getDestinationDeviceId())
                .messageType(msg.getMessageType())
                .createdAt(msg.getCreatedAt())
                .ttl(msg.getTtl())
                .hopCount(msg.getHopCount() + 1) // Increment hops
                .priority(msg.getPriority())
                .payloadHash(msg.getPayloadHash())
                .payload(msg.getPayload())
                .signature(msg.getSignature())
                .build();

        Log.i(TAG, "Relaying multi-hop message: " + msg.getMessageId() + " (Hop " + forwardedMsg.getHopCount() + "/" + forwardedMsg.getTtl() + ")");

        boolean sent = false;
        if (forwardedMsg.getDestinationDeviceId() != null && !forwardedMsg.getDestinationDeviceId().isEmpty()) {
            sent = sendManager.sendDirect(forwardedMsg, forwardedMsg.getDestinationDeviceId());
        }

        if (!sent) {
            if (forwardedMsg.getMessageType() == MessageType.DIRECT) {
                // GPSR Geographic Routing for DIRECT messages: prevent broadcast storms
                if (geoEngine != null) {
                    List<String> activeNeighbors = sendManager.getActivePeerIds();
                    List<String> candidateNeighbors = new ArrayList<>();
                    for (String neighbor : activeNeighbors) {
                        if (sourcePeerId == null || !sourcePeerId.equals(neighbor)) {
                            candidateNeighbors.add(neighbor);
                        }
                    }

                    List<String> closerPeers = geoEngine.filterCloserNeighbors(
                            forwardedMsg.getDestinationDeviceId(),
                            candidateNeighbors
                    );

                    if (!closerPeers.isEmpty()) {
                        Log.i(TAG, "GPSR: Relaying DIRECT message " + msg.getMessageId() +
                                " to " + closerPeers.size() + " geographically closer peer(s): " + closerPeers);
                        for (String closerPeerId : closerPeers) {
                            if (sendManager.sendDirect(forwardedMsg, closerPeerId)) {
                                sent = true;
                            }
                        }
                    } else {
                        Log.w(TAG, "GPSR: Suppressing blind broadcast for DIRECT message " + msg.getMessageId() +
                                " (no neighbor is closer to destination than self). Preserving mesh bandwidth.");
                        // Suppress blind broadcast to eliminate broadcast storms
                    }
                } else {
                    // Fallback to split-horizon broadcast when geoEngine is not configured
                    sent = sendManager.broadcastExcept(forwardedMsg, sourcePeerId);
                }
            } else {
                // Non-DIRECT messages (REPORT, HAZARD, BROADCAST): full mesh saturation
                sent = sendManager.broadcastExcept(forwardedMsg, sourcePeerId);
            }
        }

        if (!sent && dataEngine != null) {
            Log.i(TAG, "No other peers reachable to relay message " + msg.getMessageId() + ". Storing as DTN courier.");
            try {
                dataEngine.saveMessage(forwardedMsg);
            } catch (Exception e) {
                Log.e(TAG, "Failed to cache courier message in Room DB", e);
            }
        }
    }
}
