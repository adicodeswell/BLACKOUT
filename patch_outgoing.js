const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/transport/OutgoingSendManager.java';
let code = fs.readFileSync(path, 'utf8');

const oldDirect = `    public void sendDirect(NetworkMessage msg, String peerId) {
        PeerConnection peer = connectionManager.getConnection(peerId);
        if (peer != null) {
            try {
                byte[] bytes = MessageSerializer.serialize(msg);
                peer.send(bytes);
            } catch (JSONException e) {
                Log.e(TAG, "Failed to serialize direct message", e);
            }
        } else {
            Log.w(TAG, "Peer not found or disconnected: " + peerId);
            // In Phase 4, we will push this to the persistent queue for Store-And-Forward
        }
    }`;

const newDirect = `    public void sendDirect(NetworkMessage msg, String peerId) {
        PeerConnection peer = connectionManager.getConnection(peerId);
        if (peer != null) {
            try {
                byte[] bytes = MessageSerializer.serialize(msg);
                peer.send(bytes);
            } catch (JSONException e) {
                Log.e(TAG, "Failed to serialize direct message", e);
            }
        } else {
            Log.w(TAG, "Peer ID mismatch for " + peerId + ". Broadcasting to mesh instead.");
            // Because Wi-Fi Direct MAC addresses don't always match the Socket ID, 
            // fallback to mesh broadcast. The destination UI will filter it.
            broadcast(msg);
        }
    }`;

code = code.replace(oldDirect, newDirect);
fs.writeFileSync(path, code);
