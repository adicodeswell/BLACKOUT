package com.blackout.network.discovery;

import android.annotation.SuppressLint;
import android.net.wifi.p2p.WifiP2pManager;
import android.util.Log;

/**
 * Handles high-bandwidth connection negotiation via Wi-Fi Direct.
 * Triggered once BLE detects a peer.
 */
public class WifiDirectManager {
    private static final String TAG = "WifiDirectManager";
    
    private final WifiP2pManager p2pManager;
    private final WifiP2pManager.Channel channel;

    private boolean isGroupFormed = false;

    public WifiDirectManager(WifiP2pManager p2pManager, WifiP2pManager.Channel channel) {
        this.p2pManager = p2pManager;
        this.channel = channel;
    }

    @SuppressLint("MissingPermission")
    public void discoverPeers() {
        if (p2pManager == null || channel == null) return;
        
        Log.i(TAG, "Initiating Wi-Fi Direct Peer Discovery...");
        p2pManager.discoverPeers(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "Wi-Fi Direct discovery started successfully.");
            }

            @Override
            public void onFailure(int reasonCode) {
                Log.e(TAG, "Wi-Fi Direct discovery failed. Reason: " + reasonCode);
            }
        });
    }

    public void setGroupFormed(boolean formed) {
        this.isGroupFormed = formed;
    }

    public boolean isGroupFormed() {
        return isGroupFormed;
    }
}
