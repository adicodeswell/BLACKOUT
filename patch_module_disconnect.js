const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(path, 'utf8');

const oldMessageListener = `            MessageHandler messageHandler = new MessageHandler(connectionManager, handshakeManager, new MessageHandler.AppMessageListener() {
                @Override
                public void onApplicationMessage(NetworkMessage message) {
                    emitMessageToJS(message);
                }
            });`;

const newMessageListener = `            MessageHandler messageHandler = new MessageHandler(connectionManager, handshakeManager, new MessageHandler.AppMessageListener() {
                @Override
                public void onApplicationMessage(NetworkMessage message) {
                    emitMessageToJS(message);
                }
                @Override
                public void onPeerDisconnected(String peerId) {
                    WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                    event.putString("type", "PEER_DISCONNECTED");
                    event.putString("peer_id", peerId);
                    try {
                        getReactApplicationContext()
                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("NativeEvent", event);
                    } catch (Exception e) {}
                }
            });`;

code = code.replace(oldMessageListener, newMessageListener);

fs.writeFileSync(path, code);
