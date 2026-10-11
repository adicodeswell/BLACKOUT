package com.blackout.network.reliability;

import com.blackout.network.protocol.NetworkMessage;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * The offline holding area. If a peer is disconnected, messages wait here
 * until they reconnect and exchange a QUEUE_SUMMARY.
 * Note: MVP uses in-memory queues. Phase 8 wires this to the Room Database.
 */
public class MessageQueue {
    
    // Peer ID -> Queue of messages destined specifically for them
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<NetworkMessage>> pendingDirectMessages = new ConcurrentHashMap<>();
    
    // Broadcast messages that haven't expired yet
    private final ConcurrentLinkedQueue<NetworkMessage> pendingBroadcasts = new ConcurrentLinkedQueue<>();

    public void enqueueDirect(String peerId, NetworkMessage msg) {
        pendingDirectMessages.computeIfAbsent(peerId, k -> new ConcurrentLinkedQueue<>()).offer(msg);
    }

    public void enqueueBroadcast(NetworkMessage msg) {
        pendingBroadcasts.offer(msg);
    }

    /**
     * Drains the queue for a specific peer when they reconnect.
     */
    public List<NetworkMessage> drainPendingDirect(String peerId) {
        return drainPendingDirect(peerId, null);
    }

    /**
     * Drains the queue for a specific peer when they reconnect, checking both
     * canonical peerId and any transport alias (e.g. MAC address).
     */
    public List<NetworkMessage> drainPendingDirect(String peerId, String transportAlias) {
        List<NetworkMessage> list = new ArrayList<>();
        if (peerId != null) {
            ConcurrentLinkedQueue<NetworkMessage> q = pendingDirectMessages.remove(peerId);
            if (q != null) {
                list.addAll(q);
            }
        }
        if (transportAlias != null && !transportAlias.equals(peerId)) {
            ConcurrentLinkedQueue<NetworkMessage> qAlias = pendingDirectMessages.remove(transportAlias);
            if (qAlias != null) {
                for (NetworkMessage m : qAlias) {
                    if (peerId != null && !peerId.equals(m.getDestinationDeviceId())) {
                        NetworkMessage rewritten = new NetworkMessage.Builder()
                                .protocolVersion(m.getProtocolVersion())
                                .messageId(m.getMessageId())
                                .originDeviceId(m.getOriginDeviceId())
                                .destinationDeviceId(peerId)
                                .messageType(m.getMessageType())
                                .createdAt(m.getCreatedAt())
                                .ttl(m.getTtl())
                                .hopCount(m.getHopCount())
                                .priority(m.getPriority())
                                .payload(m.getPayload())
                                .payloadHash(m.getPayloadHash())
                                .signature(m.getSignature())
                                .build();
                        list.add(rewritten);
                    } else {
                        list.add(m);
                    }
                }
            }
        }
        return list;
    }
    
    public List<NetworkMessage> drainPendingBroadcasts() {
        List<NetworkMessage> list = new ArrayList<>(pendingBroadcasts);
        pendingBroadcasts.clear();
        return list;
    }

    public List<NetworkMessage> getPendingBroadcasts() {
        return new ArrayList<>(pendingBroadcasts);
    }
}
