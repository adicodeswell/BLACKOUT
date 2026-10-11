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
        ConcurrentLinkedQueue<NetworkMessage> q = pendingDirectMessages.get(peerId);
        if (q == null) return new ArrayList<>();
        
        List<NetworkMessage> list = new ArrayList<>(q);
        q.clear(); // Empty the queue since we are sending them
        return list;
    }
    
    public List<NetworkMessage> getPendingBroadcasts() {
        return new ArrayList<>(pendingBroadcasts);
    }
}
