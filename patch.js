const fs = require('fs');
const file = 'android/app/src/main/java/com/blackout/network/engine/AndroidNetworkEngine.java';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `        try {
            // 1. Start listening for incoming Wi-Fi Direct socket connections
            networkServer.start();
            
            // 2. Start the BLE passive discovery beacons
            if (bleEngine != null) {
                bleEngine.start();
            }
            
            // 3. Initiate Wi-Fi direct searches
            if (wifiManager != null) {
                wifiManager.discoverPeers();
            }
            
            isRunning = true;
            Log.i(TAG, "Network Engine successfully started.");
            
        } catch (IOException e) {
            Log.e(TAG, "Failed to start the Network Server", e);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start the BLE Engine", e);
        }`,
  `        try {
            // 1. Start listening for incoming Wi-Fi Direct socket connections
            networkServer.start();
        } catch (IOException e) {
            Log.e(TAG, "Failed to start the Network Server", e);
        }

        // 2. Start the BLE passive discovery beacons
        try {
            if (bleEngine != null) {
                bleEngine.start();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start the BLE Engine (Bluetooth may be disabled)", e);
        }

        // 3. Initiate Wi-Fi direct searches
        try {
            if (wifiManager != null) {
                wifiManager.discoverPeers();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to initiate Wi-Fi Direct discovery", e);
        }
        
        isRunning = true;
        Log.i(TAG, "Network Engine successfully started.");`
);
fs.writeFileSync(file, content);
