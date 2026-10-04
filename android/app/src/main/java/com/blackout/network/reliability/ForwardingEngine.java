package com.blackout.network.reliability;

import android.util.Log;

import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.transport.OutgoingSendManager;

/**
 * Evaluates incoming messages to decide if we should forward them
 * deeper into the mesh network.
 */
public class ForwardingEngine {
    private static final String TAG = "ForwardingEngine";
    
    private final String localDeviceId;
    private final OutgoingSendManager sendManager;
    private final MessageDeduplicator deduplicator;

    public ForwardingEngine(String localDeviceId, OutgoingSendManager sendManager, MessageDeduplicator deduplicator) {
        this.localDeviceId = localDeviceId;
        this.sendManager = sendManager;
        this.deduplicator = deduplicator;
    }

    /**
     * Determines if a message qualifies for store-and-forward.
     */
    public boolean shouldForward(NetworkMessage msg) {
        // 1. Don't forward our own messages back out
        if (msg.getOriginDeviceId().equals(localDeviceId)) return false;
        
        // 2. TTL (Time To Live) exceeded, drop it to prevent infinite loops
        if (msg.getHopCount() >= msg.getTtl()) {
            Log.d(TAG, "Message TTL exceeded, dropping: " + msg.getMessageId());
            return false;
        }
        
        // 3. If it was specifically for us, we don't need to forward it further
        if (localDeviceId.equals(msg.getDestinationDeviceId())) return false;

        return true;
    }

    /**
     * Rebuilds the message with an incremented hop count and broadcasts it.
     */
    public void forwardMessage(NetworkMessage msg) {
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

        Log.i(TAG, "Forwarding message: " + msg.getMessageId() + " (Hop " + forwardedMsg.getHopCount() + ")");
        sendManager.broadcast(forwardedMsg);
    }
}
