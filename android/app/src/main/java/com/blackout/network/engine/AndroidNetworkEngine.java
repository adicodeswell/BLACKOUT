package com.blackout.network.engine;

import android.content.Context;
import android.util.Log;

import com.blackout.network.discovery.BleDiscoveryEngine;
import com.blackout.network.discovery.WifiDirectManager;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.NetworkServer;

import java.io.IOException;

/**
 * The master class that ties the OS hardware scanners (BLE/WiFi) to our
 * pure Java sockets (NetworkServer) and React Native UI.
 */
public class AndroidNetworkEngine {
    private static final String TAG = "AndroidNetworkEngine";

    private final DeviceIdentity deviceIdentity;
    private final BleDiscoveryEngine bleEngine;
    private final WifiDirectManager wifiManager;
    private final ConnectionManager connectionManager;
    private final NetworkServer networkServer;

    private boolean isRunning = false;

    public AndroidNetworkEngine(
            DeviceIdentity deviceIdentity,
            BleDiscoveryEngine bleEngine,
            WifiDirectManager wifiManager,
            ConnectionManager connectionManager,
            NetworkServer networkServer) {
        
        this.deviceIdentity = deviceIdentity;
        this.bleEngine = bleEngine;
        this.wifiManager = wifiManager;
        this.connectionManager = connectionManager;
        this.networkServer = networkServer;
    }

    public synchronized void start() {
        if (isRunning) return;

        Log.i(TAG, "Starting Android Network Engine for device: " + deviceIdentity.getDeviceId());
        
        try {
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
        }
    }

    public synchronized void stop() {
        if (!isRunning) return;

        Log.i(TAG, "Stopping Android Network Engine...");
        
        if (bleEngine != null) bleEngine.stop();
        if (wifiManager != null) wifiManager.stop();
        if (networkServer != null) networkServer.stop();
        if (connectionManager != null) connectionManager.disconnectAll();
        
        isRunning = false;
    }

    public boolean isRunning() {
        return isRunning;
    }
}
