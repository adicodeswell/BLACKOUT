const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/transport/ConnectionManager.java';
let code = fs.readFileSync(file, 'utf8');

const target = `    public synchronized void updateConnectionId(String oldId, String newId) {
        PeerConnection conn = connections.remove(oldId);
        if (conn != null) {
            if (connections.containsKey(newId)) {
                Log.w(TAG, "Replacing existing connection during rename for peer: " + newId);
                PeerConnection old = connections.remove(newId);
                if (old != null) {
                    old.disconnect();
                }
            }
            conn.setPeerId(newId);
            connections.put(newId, conn);
            Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        }
    }`;

const replacement = `    public synchronized boolean updateConnectionId(String oldId, String newId, String localDeviceId) {
        PeerConnection conn = connections.get(oldId);
        if (conn == null) return false;

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
                existing.disconnect();
            }
        }

        connections.remove(oldId);
        conn.setPeerId(newId);
        connections.put(newId, conn);
        Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        return true;
    }`;

code = code.replace(target, replacement);

const getReadyTarget = `    public synchronized PeerConnection getReadyConnection(String peerId) {
        if (peerId == null || peerId.startsWith("TEMP-")) {
            return null;
        }
        return connections.get(peerId);
    }`;

const getReadyReplacement = `    public synchronized PeerConnection getReadyConnection(String peerId) {
        if (peerId == null || peerId.startsWith("TEMP-")) {
            return null;
        }
        PeerConnection conn = connections.get(peerId);
        if (conn != null && conn.isReady()) {
            return conn;
        }
        return null;
    }`;

code = code.replace(getReadyTarget, getReadyReplacement);

fs.writeFileSync(file, code);
