const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/protocol/HandshakeManager.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/connectionManager\.updateConnectionId\(peer\.getPeerId\(\), msg\.getOriginDeviceId\(\)\);/g, 
    'boolean promoted = connectionManager.updateConnectionId(peer.getPeerId(), msg.getOriginDeviceId(), localDeviceId);\n                if (!promoted) return; // Collision lost');

// Set connection to READY when Handshake is COMPLETE
const targetReady = `            case QUEUE_SUMMARY:
                Log.i(TAG, "Handshake COMPLETE. Peer is fully READY: " + msg.getOriginDeviceId());
                if (listener != null) listener.onHandshakeComplete(msg.getOriginDeviceId());
                // In Phase 4, we will use the payload payload to trigger syncs.
                // Here we would upgrade the PeerInfo status from HANDSHAKING to READY.
                break;`;

const replacementReady = `            case QUEUE_SUMMARY:
                Log.i(TAG, "Handshake COMPLETE. Peer is fully READY: " + msg.getOriginDeviceId());
                peer.setReady(true);
                if (listener != null) listener.onHandshakeComplete(msg.getOriginDeviceId());
                break;`;

code = code.replace(targetReady, replacementReady);

fs.writeFileSync(file, code);
