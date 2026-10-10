package com.blackout.network.discovery;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.WpsInfo;
import android.net.wifi.p2p.WifiP2pConfig;
import android.net.wifi.p2p.WifiP2pDevice;
import android.net.wifi.p2p.WifiP2pDeviceList;
import android.net.wifi.p2p.WifiP2pInfo;
import android.net.wifi.p2p.WifiP2pManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;

public class WifiDirectManager {
    public interface ConnectionCallback {
        void onClientConnectedToGroupOwner(Socket socket);
    }
    
    public enum State {
        DISCONNECTED,
        DISCOVERING,
        CONNECTING,
        CONNECTED
    }

    private static final String TAG = "WifiDirectManager";
    
    private final WifiP2pManager p2pManager;
    private final WifiP2pManager.Channel channel;
    private final Context context;
    private final IntentFilter intentFilter;
    private BroadcastReceiver receiver;

    private State currentState = State.DISCONNECTED;
    private List<WifiP2pDevice> peers = new ArrayList<>();
    private ConnectionCallback connectionCallback;

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

    public void setConnectionCallback(ConnectionCallback callback) {
        this.connectionCallback = callback;
    }

    private final WifiP2pManager.PeerListListener peerListListener = new WifiP2pManager.PeerListListener() {
        @Override
        public void onPeersAvailable(WifiP2pDeviceList peerList) {
            peers.clear();
            peers.addAll(peerList.getDeviceList());
            Log.i(TAG, "Wi-Fi Direct Peers found: " + peers.size());
            // No auto-connect anymore! Wait for manual connection from UI.
        }
    };

    @SuppressLint("MissingPermission")
    public void discoverPeers() {
        if (p2pManager == null || channel == null) return;
        if (currentState == State.CONNECTING || currentState == State.CONNECTED) {
            Log.i(TAG, "Skipping discovery because state is " + currentState);
            return;
        }
        
        currentState = State.DISCOVERING;
        Log.i(TAG, "Initiating Wi-Fi Direct Peer Discovery...");
        
        if (receiver == null) {
            receiver = createReceiver();
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
                currentState = State.DISCONNECTED;
            }
        });
    }

    @SuppressLint("MissingPermission")
    public void connectToAddress(String deviceAddress) {
        if (p2pManager == null || channel == null) return;
        
        Log.i(TAG, "Connecting to address: " + deviceAddress);
        currentState = State.CONNECTING;
        
        // Stop discovery before connecting to increase success rate
        p2pManager.stopPeerDiscovery(channel, null);

        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = deviceAddress;
        config.wps.setup = WpsInfo.PBC;
        
        p2pManager.connect(channel, config, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "Successfully initiated connect to " + deviceAddress);
            }
            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "Connect failed. Reason: " + reason);
                currentState = State.DISCONNECTED;
            }
        });
    }

    private BroadcastReceiver createReceiver() {
        return new BroadcastReceiver() {
            @SuppressLint("MissingPermission")
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION.equals(action)) {
                    if (p2pManager != null && currentState != State.CONNECTING) {
                        p2pManager.requestPeers(channel, peerListListener);
                    }
                } else if (WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION.equals(action)) {
                    android.net.NetworkInfo networkInfo = intent.getParcelableExtra(WifiP2pManager.EXTRA_NETWORK_INFO);
                    if (networkInfo != null && networkInfo.isConnected()) {
                        currentState = State.CONNECTED;
                        p2pManager.requestConnectionInfo(channel, info -> {
                            if (info.groupFormed && !info.isGroupOwner) {
                                // We are client, connect to GO
                                new Thread(() -> {
                                    int maxRetries = 5;
                                    for (int i = 0; i < maxRetries; i++) {
                                        try {
                                            Log.i(TAG, "Attempt " + (i+1) + " to connect to GO...");
                                            Socket socket = new Socket();
                                            socket.connect(new InetSocketAddress(info.groupOwnerAddress, 18888), 10000);
                                            Log.i(TAG, "TCP socket connected to GO!");
                                            if (connectionCallback != null) {
                                                connectionCallback.onClientConnectedToGroupOwner(socket);
                                            }
                                            break;
                                        } catch (Exception e) {
                                            Log.e(TAG, "Socket connection failed", e);
                                            try { Thread.sleep(2000); } catch (Exception ignored) {}
                                        }
                                    }
                                }).start();
                            }
                        });
                    } else {
                        currentState = State.DISCONNECTED;
                    }
                }
            }
        };
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
            p2pManager.removeGroup(channel, null);
        }
        currentState = State.DISCONNECTED;
    }

    public List<WifiP2pDevice> getDiscoveredPeers() {
        return new ArrayList<>(peers);
    }
}
