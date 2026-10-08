const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(path, 'utf8');

const target1 = `import com.facebook.react.bridge.WritableMap;`;
const inject1 = `import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import java.util.List;
import android.net.wifi.p2p.WifiP2pDevice;`;
code = code.replace(target1, inject1);

const target2 = `    @ReactMethod
    public void addListener(String eventName) {`;

const inject2 = `    @ReactMethod
    public void getPeers(Promise promise) {
        try {
            WritableArray peersArray = Arguments.createArray();
            if (networkEngine != null) {
                // Get Wi-Fi Direct discovered peers
                List<WifiP2pDevice> wifiPeers = networkEngine.getWifiPeers();
                for (WifiP2pDevice device : wifiPeers) {
                    WritableMap peer = Arguments.createMap();
                    peer.putString("peer_id", device.deviceAddress);
                    peer.putString("name", device.deviceName);
                    peer.putString("connection_state", "DISCOVERED");
                    peer.putInt("signal_strength", 80);
                    peer.putDouble("last_seen", System.currentTimeMillis());
                    peer.putString("transport_type", "WIFI_DIRECT");
                    peersArray.pushMap(peer);
                }
                
                // Get Active TCP Connections
                if (connectionManager != null) {
                    List<String> connectedIds = connectionManager.getActivePeerIds();
                    for (String peerId : connectedIds) {
                        WritableMap peer = Arguments.createMap();
                        peer.putString("peer_id", peerId);
                        peer.putString("name", "Mesh Node " + peerId.substring(0, Math.min(4, peerId.length())));
                        peer.putString("connection_state", "CONNECTED");
                        peer.putInt("signal_strength", 100);
                        peer.putDouble("last_seen", System.currentTimeMillis());
                        peer.putString("transport_type", "WIFI_DIRECT");
                        peersArray.pushMap(peer);
                    }
                }
            }
            promise.resolve(peersArray);
        } catch (Exception e) {
            promise.reject("GET_PEERS_ERROR", e);
        }
    }

    @ReactMethod
    public void discoverPeers(Promise promise) {
        try {
            if (networkEngine != null) {
                promise.resolve(null);
            } else {
                promise.reject("ENGINE_NOT_READY", "Initialize the engine first");
            }
        } catch (Exception e) {
            promise.reject("DISCOVER_ERROR", e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {`;

code = code.replace(target2, inject2);
fs.writeFileSync(path, code);
