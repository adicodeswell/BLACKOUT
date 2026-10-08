const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/protocol/MessageHandler.java';
let code = fs.readFileSync(path, 'utf8');

const oldListener = `    public interface AppMessageListener {
        void onApplicationMessage(NetworkMessage message);
    }`;

const newListener = `    public interface AppMessageListener {
        void onApplicationMessage(NetworkMessage message);
        void onPeerDisconnected(String peerId);
    }`;

code = code.replace(oldListener, newListener);

const oldDisconnect = `    @Override
    public void onDisconnected(String peerId) {
        Log.i(TAG, "Peer disconnected in MessageHandler: " + peerId);
        connectionManager.removeConnection(peerId);
    }`;

const newDisconnect = `    @Override
    public void onDisconnected(String peerId) {
        Log.i(TAG, "Peer disconnected in MessageHandler: " + peerId);
        connectionManager.removeConnection(peerId);
        if (appListener != null) {
            appListener.onPeerDisconnected(peerId);
        }
    }`;

code = code.replace(oldDisconnect, newDisconnect);

fs.writeFileSync(path, code);
