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
    private final ConcurrentHashMap<String, String> aliases = new ConcurrentHashMap<>();

    /**
     * Registers and starts a new peer connection.
     */
        public synchronized boolean updateConnectionId(String oldId, String newId, String localDeviceId) {
        PeerConnection conn = connections.get(oldId);
        if (conn == null) return false;
        
        if (oldId.equals(newId)) {
            return true;
        }

        PeerConnection existing = connections.get(newId);
        if (existing != null) {
            if (existing.isReady()) {
                Log.w(TAG, "Collision: existing connection already READY. Dropping new.");
                connections.remove(oldId);
                conn.disconnect();
                return false;
            }
            if (localDeviceId != null && localDeviceId.compareTo(newId) < 0) {
                Log.w(TAG, "Collision: keeping existing connection deterministically.");
                connections.remove(oldId);
                conn.disconnect();
                return false;
            } else {
                Log.w(TAG, "Collision: replacing existing connection deterministically.");
                connections.remove(newId);
                aliases.values().removeIf(val -> val.equals(newId));
                existing.disconnect();
            }
        }

        connections.remove(oldId);
        conn.setPeerId(newId);
        connections.put(newId, conn);
        aliases.put(oldId, newId);
        Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        return true;
    }

    public synchronized void addConnection(PeerConnection connection) {
        String peerId = connection.getPeerId();
        
        // If we already have a connection to this peer, disconnect the old one
        if (connections.containsKey(peerId)) {
            Log.w(TAG, "Replacing existing connection for peer: " + peerId);
            PeerConnection old = connections.remove(peerId);
            aliases.values().removeIf(val -> val.equals(peerId));
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
    public synchronized void removeConnection(String peerId) {
        PeerConnection connection = connections.remove(peerId);
        aliases.values().removeIf(val -> val.equals(peerId));
        if (connection != null) {
            connection.disconnect();
            Log.i(TAG, "Removed and disconnected peer: " + peerId);
        }
    }

    /**
     * Gets a specific active connection.
     */
    public synchronized PeerConnection getReadyConnection(String peerId) {
        if (peerId == null || peerId.startsWith("TEMP-")) {
            return null;
        }
        PeerConnection conn = getConnection(peerId);
        if (conn != null && conn.isReady()) {
            return conn;
        }
        return null;
    }

    public synchronized PeerConnection getConnection(String peerId) {
        PeerConnection conn = connections.get(peerId);
        if (conn == null && aliases.containsKey(peerId)) {
            return connections.get(aliases.get(peerId));
        }
        return conn;
    }

    /**
     * Broadcasts a framed byte payload to ALL currently connected peers.
     * Useful for mesh store-and-forward.
     */
    public synchronized boolean broadcast(byte[] payload) {
        if (connections.isEmpty()) return false;
        for (PeerConnection conn : connections.values()) {
            conn.send(payload);
        }
        return true;
    }
    
    /**
     * Returns a snapshot list of all currently connected Peer IDs.
     */
    public synchronized List<String> getActivePeerIds() {
        List<String> activeIds = new ArrayList<>();
        for (PeerConnection conn : connections.values()) {
            if (conn.isReady()) {
                activeIds.add(conn.getPeerId());
            }
        }
        return activeIds;
    }

    /**
     * Disconnects all peers (e.g., when the app shuts down or network goes offline).
     */
    public synchronized void disconnectAll() {
        for (String peerId : connections.keySet()) {
            removeConnection(peerId);
        }
        connections.clear();
        Log.i(TAG, "All connections closed.");
    }
}
