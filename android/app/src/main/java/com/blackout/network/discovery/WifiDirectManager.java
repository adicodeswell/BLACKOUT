package com.blackout.network.discovery;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.p2p.WifiP2pDevice;
import android.net.wifi.p2p.WifiP2pDeviceList;
import android.net.wifi.p2p.WifiP2pManager;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

/**
 * Handles high-bandwidth connection negotiation via Wi-Fi Direct.
 * Discovers peers and registers broadcast receivers for P2P events.
 */
public class WifiDirectManager {
    private static final String TAG = "WifiDirectManager";
    
    private final WifiP2pManager p2pManager;
    private final WifiP2pManager.Channel channel;
    private final Context context;
    private final IntentFilter intentFilter;
    private BroadcastReceiver receiver;

    private boolean isGroupFormed = false;
    private List<WifiP2pDevice> peers = new ArrayList<>();

    public WifiDirectManager(WifiP2pManager p2pManager, WifiP2pManager.Channel channel, Context context) {
        this.p2pManager = p2pManager;
        this.channel = channel;
        this.context = context;

        intentFilter = new IntentFilter();
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION);
    }

    private final WifiP2pManager.PeerListListener peerListListener = new WifiP2pManager.PeerListListener() {
        @Override
        public void onPeersAvailable(WifiP2pDeviceList peerList) {
            if (!peerList.getDeviceList().equals(peers)) {
                peers.clear();
                peers.addAll(peerList.getDeviceList());
                Log.i(TAG, "Wi-Fi Direct Peers found: " + peers.size());
                
                // Trigger connection logic to first peer in production implementation
                // if (!peers.isEmpty() && !isGroupFormed) {
                //     connectToPeer(peers.get(0));
                // }
            }
        }
    };

    @SuppressLint("MissingPermission")
    public void discoverPeers() {
        if (p2pManager == null || channel == null) return;
        
        Log.i(TAG, "Initiating Wi-Fi Direct Peer Discovery...");
        
        if (receiver == null) {
            receiver = new BroadcastReceiver() {
                @SuppressLint("MissingPermission")
                @Override
                public void onReceive(Context context, Intent intent) {
                    String action = intent.getAction();
                    if (WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION.equals(action)) {
                        if (p2pManager != null) {
                            p2pManager.requestPeers(channel, peerListListener);
                        }
                    } else if (WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION.equals(action)) {
                        // Handle network connection changes
                    }
                }
            };
            context.registerReceiver(receiver, intentFilter);
        }

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

    public void stop() {
        if (receiver != null && context != null) {
            try {
                context.unregisterReceiver(receiver);
                receiver = null;
            } catch (Exception e) {
                Log.e(TAG, "Failed to unregister Wi-Fi Direct receiver", e);
            }
        }
        if (p2pManager != null && channel != null) {
            p2pManager.stopPeerDiscovery(channel, null);
        }
    }

    public List<WifiP2pDevice> getDiscoveredPeers() {
        return new ArrayList<>(peers);
    }

    public void setGroupFormed(boolean formed) {
        this.isGroupFormed = formed;
    }

    public boolean isGroupFormed() {
        return isGroupFormed;
    }
}
