const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix the callback injection for WifiDirectManager
const oldWifiInit = `WifiDirectManager wifiManager = new WifiDirectManager(wifiP2pManager, channel, ctx);`;
const newWifiInit = `WifiDirectManager wifiManager = new WifiDirectManager(wifiP2pManager, channel, ctx);
            wifiManager.setConnectionCallback(new WifiDirectManager.ConnectionCallback() {
                @Override
                public void onClientConnectedToGroupOwner(java.net.Socket socket) {
                    PeerConnection peer = new PeerConnection("CLIENT-SOCKET", socket, messageHandler);
                    connectionManager.addConnection(peer);
                    peer.start();
                    // Send dummy bytes to unblock read loop or handshake if needed
                    handshakeManager.initiateHandshake(peer);
                }
            });`;
code = code.replace(oldWifiInit, newWifiInit);

// 2. Add Handshake to Server socket
const oldServerInit = `PeerConnection peer = new PeerConnection("UNKNOWN-PEER", socket, messageHandler);
                connectionManager.addConnection(peer);
                peer.start();`;
const newServerInit = `PeerConnection peer = new PeerConnection("UNKNOWN-PEER", socket, messageHandler);
                connectionManager.addConnection(peer);
                peer.start();
                handshakeManager.initiateHandshake(peer);`;
code = code.replace(oldServerInit, newServerInit);

fs.writeFileSync(path, code);
