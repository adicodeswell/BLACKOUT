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
    private String localDeviceId;
    private final ConcurrentHashMap<String, Boolean> localAliases = new ConcurrentHashMap<>();

    public synchronized void setLocalDeviceId(String localDeviceId) {
        this.localDeviceId = localDeviceId;
    }

    public synchronized String getLocalDeviceId() {
        return this.localDeviceId;
    }

    public synchronized void registerLocalAlias(String alias) {
        if (alias != null && !alias.isEmpty()) {
            localAliases.put(alias, Boolean.TRUE);
            localAliases.put(alias.toLowerCase(), Boolean.TRUE);
            localAliases.put(alias.toUpperCase(), Boolean.TRUE);
        }
    }

    public synchronized boolean isLocalDestination(String destId) {
        if (destId == null || destId.isEmpty()) {
            return true; // Broadcast / flood messages are delivered locally
        }
        if (localDeviceId != null && destId.equalsIgnoreCase(localDeviceId)) {
            return true;
        }
        return localAliases.containsKey(destId) ||
               localAliases.containsKey(destId.toLowerCase()) ||
               localAliases.containsKey(destId.toUpperCase());
    }

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
        registerAlias(oldId, newId);
        if (conn.getTransportAddress() != null) {
            registerAlias(conn.getTransportAddress(), newId);
        }
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
        if (peerId == null) return null;
        PeerConnection conn = connections.get(peerId);
        if (conn == null) {
            String canonical = aliases.get(peerId);
            if (canonical == null) canonical = aliases.get(peerId.toLowerCase());
            if (canonical == null) canonical = aliases.get(peerId.toUpperCase());
            if (canonical != null) {
                conn = connections.get(canonical);
            }
        }
        return conn;
    }

    public synchronized void registerAlias(String aliasOrTransport, String canonicalId) {
        if (aliasOrTransport != null && canonicalId != null) {
            aliases.put(aliasOrTransport, canonicalId);
            aliases.put(aliasOrTransport.toLowerCase(), canonicalId);
            aliases.put(aliasOrTransport.toUpperCase(), canonicalId);
            aliases.put(canonicalId, aliasOrTransport);
        }
    }

    public synchronized String resolveCanonicalId(String idOrAlias) {
        if (idOrAlias == null) return null;
        if (connections.containsKey(idOrAlias)) return idOrAlias;
        String canonical = aliases.get(idOrAlias);
        if (canonical != null) return canonical;
        canonical = aliases.get(idOrAlias.toLowerCase());
        if (canonical != null) return canonical;
        canonical = aliases.get(idOrAlias.toUpperCase());
        if (canonical != null) return canonical;
        return idOrAlias;
    }

    public synchronized String resolveTransportAddress(String canonicalId) {
        if (canonicalId == null) return null;
        for (java.util.Map.Entry<String, String> entry : aliases.entrySet()) {
            if (entry.getValue().equalsIgnoreCase(canonicalId) && entry.getKey().contains(":")) {
                return entry.getKey();
            }
        }
        return canonicalId;
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
     * Broadcasts a framed byte payload to all connected peers EXCEPT the specified peer ID.
     * Implements split-horizon suppression to prevent routing loops in multi-hop mesh.
     */
    public synchronized boolean broadcastExcept(byte[] payload, String excludedPeerId) {
        if (connections.isEmpty()) return false;
        boolean sentAny = false;
        for (PeerConnection conn : connections.values()) {
            if (conn.isReady()) {
                String id = conn.getPeerId();
                if (excludedPeerId != null) {
                    if (excludedPeerId.equals(id) || 
                        excludedPeerId.equals(conn.getTransportAddress()) ||
                        (aliases.containsKey(excludedPeerId) && aliases.get(excludedPeerId).equals(id))) {
                        continue;
                    }
                }
                conn.send(payload);
                sentAny = true;
            }
        }
        return sentAny;
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
