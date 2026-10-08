const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/discovery/WifiDirectManager.java';
let code = fs.readFileSync(path, 'utf8');

// 1. Add WpsInfo import
code = code.replace(
  'import android.net.wifi.p2p.WifiP2pConfig;',
  'import android.net.wifi.p2p.WifiP2pConfig;\nimport android.net.wifi.WpsInfo;'
);

// 2. Patch connectToPeer to include WPS and avoid collisions
const oldConnect = `    private void connectToPeer(WifiP2pDevice device) {
        if (p2pManager == null || channel == null) return;
        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = device.deviceAddress;
        p2pManager.connect(channel, config, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() { Log.i(TAG, "Successfully initiated connect to " + device.deviceName); }
            @Override
            public void onFailure(int reason) { Log.e(TAG, "Connect failed. Reason: " + reason); }
        });
    }`;

const newConnect = `    private void connectToPeer(WifiP2pDevice device) {
        if (p2pManager == null || channel == null) return;
        
        // Prevent collision: only initiate if the device is actually AVAILABLE
        if (device.status != android.net.wifi.p2p.WifiP2pDevice.AVAILABLE) {
            Log.i(TAG, "Skipping connect to " + device.deviceName + " because status is " + device.status);
            return;
        }

        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = device.deviceAddress;
        config.wps.setup = WpsInfo.PBC; // Push Button Configuration (Standard)
        
        p2pManager.connect(channel, config, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() { Log.i(TAG, "Successfully initiated connect to " + device.deviceName); }
            @Override
            public void onFailure(int reason) { Log.e(TAG, "Connect failed. Reason: " + reason); }
        });
    }`;

code = code.replace(oldConnect, newConnect);

// 3. Patch the Socket Client to retry if the ServerSocket isn't up yet
const oldSocket = `                                        new Thread(() -> {
                                            try {
                                                Socket socket = new Socket();
                                                socket.connect(new InetSocketAddress(info.groupOwnerAddress, 18888), 10000);
                                                if (connectionCallback != null) {
                                                    connectionCallback.onClientConnectedToGroupOwner(socket);
                                                }
                                            } catch (Exception e) {
                                                Log.e(TAG, "Failed to connect to Group Owner", e);
                                            }
                                        }).start();`;

const newSocket = `                                        new Thread(() -> {
                                            int maxRetries = 5;
                                            for (int i = 0; i < maxRetries; i++) {
                                                try {
                                                    Log.i(TAG, "Attempt " + (i+1) + " to connect to Group Owner...");
                                                    Socket socket = new Socket();
                                                    socket.connect(new InetSocketAddress(info.groupOwnerAddress, 18888), 10000);
                                                    if (connectionCallback != null) {
                                                        connectionCallback.onClientConnectedToGroupOwner(socket);
                                                    }
                                                    Log.i(TAG, "Successfully connected Client Socket to Group Owner!");
                                                    break; // Success, exit retry loop
                                                } catch (Exception e) {
                                                    Log.e(TAG, "Failed to connect to Group Owner (Attempt " + (i+1) + ")", e);
                                                    try {
                                                        Thread.sleep(2000); // Wait 2s before retrying so the Server has time to boot
                                                    } catch (InterruptedException ie) {
                                                        break;
                                                    }
                                                }
                                            }
                                        }).start();`;

code = code.replace(oldSocket, newSocket);

fs.writeFileSync(path, code);
