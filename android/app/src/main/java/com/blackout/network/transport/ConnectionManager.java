package com.blackout.network.transport;

import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A central registry managing all active PeerConnection objects in the mesh.
 */
public class ConnectionManager {
    private static final String TAG = "ConnectionManager";

    // Thread-safe map of Peer ID -> Active Connection
    private final ConcurrentHashMap<String, PeerConnection> connections = new ConcurrentHashMap<>();

    /**
     * Registers and starts a new peer connection.
     */
        public void updateConnectionId(String oldId, String newId) {
        PeerConnection conn = connections.remove(oldId);
        if (conn != null) {
            conn.setPeerId(newId);
            connections.put(newId, conn);
            Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        }
    }

    public void addConnection(PeerConnection connection) {
        String peerId = connection.getPeerId();
        
        // If we already have a connection to this peer, disconnect the old one
        if (connections.containsKey(peerId)) {
            Log.w(TAG, "Replacing existing connection for peer: " + peerId);
            PeerConnection old = connections.remove(peerId);
            if (old != null) {
                old.disconnect();
            }
        }
        
        connections.put(peerId, connection);
        connection.start();
        Log.i(TAG, "Added and started connection for peer: " + peerId);
    }

    /**
     * Removes and disconnects a peer.
     */
    public void removeConnection(String peerId) {
        PeerConnection connection = connections.remove(peerId);
        if (connection != null) {
            connection.disconnect();
            Log.i(TAG, "Removed and disconnected peer: " + peerId);
        }
    }

    /**
     * Gets a specific active connection.
     */
    public PeerConnection getConnection(String peerId) {
        return connections.get(peerId);
    }

    /**
     * Broadcasts a framed byte payload to ALL currently connected peers.
     * Useful for mesh store-and-forward.
     */
    public void broadcast(byte[] payload) {
        for (PeerConnection conn : connections.values()) {
            conn.send(payload);
        }
    }
    
    /**
     * Returns a snapshot list of all currently connected Peer IDs.
     */
    public List<String> getActivePeerIds() {
        return new ArrayList<>(connections.keySet());
    }

    /**
     * Disconnects all peers (e.g., when the app shuts down or network goes offline).
     */
    public void disconnectAll() {
        for (String peerId : connections.keySet()) {
            removeConnection(peerId);
        }
        connections.clear();
        Log.i(TAG, "All connections closed.");
    }
}
