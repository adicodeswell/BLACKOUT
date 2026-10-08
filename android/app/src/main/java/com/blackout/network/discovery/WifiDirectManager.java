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
import android.os.Handler;
import android.os.Looper;

import java.util.ArrayList;
import java.util.List;

/**
 * Handles high-bandwidth connection negotiation via Wi-Fi Direct.
 * Discovers peers and registers broadcast receivers for P2P events.
 */
import android.net.wifi.p2p.WifiP2pConfig;
import android.net.wifi.WpsInfo;
import android.net.wifi.p2p.WifiP2pInfo;
import java.net.Socket;
import java.net.InetSocketAddress;

public class WifiDirectManager {
    public interface ConnectionCallback {
        void onClientConnectedToGroupOwner(Socket socket);
    }
    
    private ConnectionCallback connectionCallback;
    
    public void setConnectionCallback(ConnectionCallback callback) {
        this.connectionCallback = callback;
    }
    
    private void connectToPeer(WifiP2pDevice device) {
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
    }
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
                if (!peers.isEmpty() && !isGroupFormed) {
                    connectToPeer(peers.get(0));
                }
            }
        }
    };

    private final Handler discoveryHandler = new Handler(Looper.getMainLooper());
    private final Runnable discoveryRunnable = new Runnable() {
        @Override
        public void run() {
            if (p2pManager != null && channel != null && !isGroupFormed) {
                Log.i(TAG, "Aggressive Mesh Retry: Restarting Wi-Fi Direct Discovery...");
                discoverPeersInternal();
            }
            // Retry every 15 seconds to find new nodes walking into range
            discoveryHandler.postDelayed(this, 15000);
        }
    };

    @SuppressLint("MissingPermission")
    public void discoverPeers() {
        if (p2pManager == null || channel == null) return;
        
        // Start the continuous aggressive retry loop
        discoveryHandler.removeCallbacks(discoveryRunnable);
        discoveryHandler.post(discoveryRunnable);
    }

    @SuppressLint("MissingPermission")
    private void discoverPeersInternal() {
        
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
                        android.net.NetworkInfo networkInfo = intent.getParcelableExtra(WifiP2pManager.EXTRA_NETWORK_INFO);
                        if (networkInfo != null && networkInfo.isConnected()) {
                            p2pManager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
                                @Override
                                public void onConnectionInfoAvailable(WifiP2pInfo info) {
                                    isGroupFormed = info.groupFormed;
                                    if (info.groupFormed && !info.isGroupOwner) {
                                        // We are client, connect to GO
                                        new Thread(() -> {
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
                                        }).start();
                                    }
                                }
                            });
                        } else {
                            isGroupFormed = false;
                        }
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
        discoveryHandler.removeCallbacks(discoveryRunnable);
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
