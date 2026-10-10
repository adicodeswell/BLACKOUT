const fs = require('fs');
const file = 'app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(file, 'utf8');

const target = `                        for (android.net.wifi.p2p.WifiP2pDevice device : peers) {
                            com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();`;

const replacement = `                        for (android.net.wifi.p2p.WifiP2pDevice device : peers) {
                            if (device.status == android.net.wifi.p2p.WifiP2pDevice.CONNECTED) continue;
                            com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
