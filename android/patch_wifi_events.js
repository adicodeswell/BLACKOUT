const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/discovery/WifiDirectManager.java';
let code = fs.readFileSync(file, 'utf8');

// Add a connectionState callback
code = code.replace(/public interface DiscoveryCallback {/, `public interface DiscoveryCallback {
        void onPeersDiscovered(List<WifiP2pDevice> peers);
        void onConnectionStateChanged(String deviceAddress, State state);
    }`);

// Update connection state to notify
code = code.replace(/currentState = State\.CONNECTING;/g, `currentState = State.CONNECTING;
        if (discoveryCallback != null) {
            discoveryCallback.onConnectionStateChanged(deviceAddress, currentState);
        }`);

fs.writeFileSync(file, code);
