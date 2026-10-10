const fs = require('fs');
const file = 'app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(file, 'utf8');

const target = `                List<WifiP2pDevice> wifiPeers = networkEngine.getWifiPeers();
                for (WifiP2pDevice device : wifiPeers) {
                    WritableMap peer = Arguments.createMap();`;

const replacement = `                List<android.net.wifi.p2p.WifiP2pDevice> wifiPeers = networkEngine.getWifiPeers();
                for (android.net.wifi.p2p.WifiP2pDevice device : wifiPeers) {
                    if (device.status == android.net.wifi.p2p.WifiP2pDevice.CONNECTED) continue;
                    WritableMap peer = Arguments.createMap();`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
