const fs = require('fs');

// 1. PeerConnection.java
const peerConnPath = 'android/app/src/main/java/com/blackout/network/transport/PeerConnection.java';
let peerConn = fs.readFileSync(peerConnPath, 'utf8');
peerConn = peerConn.replace('private final String peerId;', 'private String peerId;');
peerConn += `
    public void setPeerId(String newId) {
        this.peerId = newId;
    }
`;
fs.writeFileSync(peerConnPath, peerConn);

// 2. ConnectionManager.java
const connMgrPath = 'android/app/src/main/java/com/blackout/network/transport/ConnectionManager.java';
let connMgr = fs.readFileSync(connMgrPath, 'utf8');
connMgr = connMgr.replace('public void addConnection(PeerConnection connection) {', 
`    public void updateConnectionId(String oldId, String newId) {
        PeerConnection conn = connections.remove(oldId);
        if (conn != null) {
            conn.setPeerId(newId);
            connections.put(newId, conn);
            Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        }
    }

    public void addConnection(PeerConnection connection) {`);
fs.writeFileSync(connMgrPath, connMgr);

// 3. HandshakeManager.java
const hsPath = 'android/app/src/main/java/com/blackout/network/protocol/HandshakeManager.java';
let hs = fs.readFileSync(hsPath, 'utf8');
hs = hs.replace(
`                sendToPeer(peer, ack);
                Log.i(TAG, "Sent HELLO_ACK to peer: " + msg.getOriginDeviceId());
                break;`,
`                // Rename the connection to the true sender's ID!
                connectionManager.updateConnectionId(peer.getPeerId(), msg.getOriginDeviceId());
                sendToPeer(peer, ack);
                Log.i(TAG, "Sent HELLO_ACK to peer: " + msg.getOriginDeviceId());
                break;`);

hs = hs.replace(
`                Log.i(TAG, "Received HELLO_ACK from peer: " + msg.getOriginDeviceId());
                
                NetworkMessage cap = new NetworkMessage.Builder()`,
`                Log.i(TAG, "Received HELLO_ACK from peer: " + msg.getOriginDeviceId());
                connectionManager.updateConnectionId(peer.getPeerId(), msg.getOriginDeviceId());
                
                NetworkMessage cap = new NetworkMessage.Builder()`);

fs.writeFileSync(hsPath, hs);
