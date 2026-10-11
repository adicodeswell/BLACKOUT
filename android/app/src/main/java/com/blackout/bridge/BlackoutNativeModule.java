package com.blackout.bridge;

import androidx.annotation.NonNull;
import android.util.Log;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.net.wifi.p2p.WifiP2pManager;

import com.blackout.network.discovery.BleDiscoveryEngine;
import com.blackout.network.discovery.WifiDirectManager;
import com.blackout.network.engine.AndroidNetworkEngine;
import com.blackout.network.engine.DeviceIdentity;
import com.blackout.network.protocol.HandshakeManager;
import com.blackout.network.protocol.MessageHandler;
import com.blackout.network.protocol.MessageSerializer;
import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.NetworkServer;
import com.blackout.network.transport.OutgoingSendManager;
import com.blackout.network.transport.PeerConnection;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import java.nio.charset.StandardCharsets;
import java.util.List;
import android.net.wifi.p2p.WifiP2pDevice;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;
import java.util.Map;

public class BlackoutNativeModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "BlackoutNativeModule";
    private AndroidNetworkEngine networkEngine;
    private OutgoingSendManager outgoingSendManager;
    private ConnectionManager connectionManager;
    private String localDeviceId;
    private com.blackout.network.reliability.ForwardingEngine forwardingEngine;
    private com.blackout.data.RoomDataEngine roomDataEngine;

    public BlackoutNativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "BlackoutNativeModule";
    }

    @ReactMethod
    public void initialize(String ignoredNodeId, Promise promise) {
        try {
            if (networkEngine != null) {
                WifiDirectManager wdm = ((AndroidNetworkEngine) networkEngine).getWifiDirectManager();
                if (wdm != null) wdm.discoverPeers();
                DeviceIdentity identity = new DeviceIdentity(getReactApplicationContext());
                promise.resolve(identity.getDeviceId());
                return;
            }
            
            ReactApplicationContext ctx = getReactApplicationContext();
            DeviceIdentity identity = new DeviceIdentity(ctx);
            localDeviceId = identity.getDeviceId();
            connectionManager = new ConnectionManager();
            outgoingSendManager = new OutgoingSendManager(connectionManager);
            
            roomDataEngine = new com.blackout.data.RoomDataEngine(ctx.getApplicationContext());
            com.blackout.network.reliability.MessageDeduplicator deduplicator = new com.blackout.network.reliability.MessageDeduplicator();
            forwardingEngine = new com.blackout.network.reliability.ForwardingEngine(localDeviceId, outgoingSendManager, deduplicator);
            forwardingEngine.setDataEngine(roomDataEngine);
            forwardingEngine.setGeoEngine(BlackoutGeoModule.getSharedGeoEngine());

            com.blackout.network.reliability.AntiEntropyEngine antiEntropyEngine = 
                new com.blackout.network.reliability.AntiEntropyEngine(localDeviceId, roomDataEngine);

            HandshakeManager handshakeManager = new HandshakeManager(localDeviceId, connectionManager, new HandshakeManager.HandshakeListener() {
                @Override
                public void onHandshakeComplete(String peerId) {
                    WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                    event.putString("type", "PEER_CONNECTED");
                    event.putString("peer_id", peerId);
                    try {
                        getReactApplicationContext().getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("NativeEvent", event);
                    } catch (Exception e) {}
                }
            });
            handshakeManager.setAntiEntropyEngine(antiEntropyEngine);
            
            MessageHandler messageHandler = new MessageHandler(connectionManager, handshakeManager, deduplicator, new MessageHandler.AppMessageListener() {
                @Override
                public void onApplicationMessage(String sourcePeerId, NetworkMessage message) {
                    try {
                        com.blackout.geolocation.OfflineGeoEngine geo = BlackoutGeoModule.getSharedGeoEngine();
                        if (geo != null && message.getPayload() != null && message.getOriginDeviceId() != null) {
                            org.json.JSONObject payloadObj = new org.json.JSONObject(message.getPayload());
                            if (payloadObj.has("location")) {
                                org.json.JSONObject locObj = payloadObj.optJSONObject("location");
                                if (locObj != null && locObj.has("latitude") && locObj.has("longitude")) {
                                    geo.updatePeerLocation(message.getOriginDeviceId(), locObj.optDouble("latitude"), locObj.optDouble("longitude"));
                                }
                            }
                        }
                    } catch (Exception ignored) {}

                    String dest = message.getDestinationDeviceId();
                    if (dest == null || dest.isEmpty()) {
                        // Broadcast / Hazard / Report: deliver to local UI and forward deeper into mesh
                        if (roomDataEngine != null) {
                            roomDataEngine.saveMessage(message, "RECEIVED");
                        }
                        emitMessageToJS(message);
                        if (forwardingEngine != null && forwardingEngine.shouldForward(message)) {
                            forwardingEngine.forwardMessage(message, sourcePeerId);
                        }
                    } else if (dest.equals(localDeviceId)) {
                        // Directed to this device: final hop reached
                        if (message.getMessageType() == MessageType.ACK) {
                            handleIncomingAck(message);
                        } else {
                            handleIncomingDirectMessage(message);
                        }
                    } else {
                        // Directed to another peer: relay via multi-hop forwarding
                        if (forwardingEngine != null && forwardingEngine.shouldForward(message)) {
                            forwardingEngine.forwardMessage(message, sourcePeerId);
                        }
                    }
                }
                @Override
                public void onPeerDisconnected(String peerId) {
                    WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                    event.putString("type", "PEER_DISCONNECTED");
                    event.putString("peer_id", peerId);
                    try {
                        getReactApplicationContext()
                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("NativeEvent", event);
                    } catch (Exception e) {}
                }
            });
            messageHandler.setAntiEntropyEngine(antiEntropyEngine);
            
            NetworkServer networkServer = new NetworkServer(18888, socket -> {
                // Create a placeholder connection. HandshakeManager updates this later in Phase 7.
                String tempId = "TEMP-" + java.util.UUID.randomUUID().toString().substring(0,8);
                PeerConnection peer = new PeerConnection(tempId, socket, messageHandler);
                if (socket.getInetAddress() != null) {
                    peer.setTransportAddress(socket.getInetAddress().getHostAddress());
                }
                connectionManager.addConnection(peer);
                
                peer.start();
                try {
                    com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();
                    peerMap.putString("peer_id", tempId);
                    peerMap.putString("connection_state", "HANDSHAKING");
                    peerMap.putString("transport", "WIFI_DIRECT");
                    com.facebook.react.bridge.WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                    event.putString("type", "PEER_DISCOVERED");
                    event.putMap("peer", peerMap);
                    getReactApplicationContext().getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("NativeEvent", event);
                } catch (Exception e) {}
                handshakeManager.initiateHandshake(peer);

            });

            // Inject hardware adapters
            BluetoothManager bluetoothManager = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter bluetoothAdapter = bluetoothManager != null ? bluetoothManager.getAdapter() : null;

            WifiP2pManager wifiP2pManager = (WifiP2pManager) ctx.getSystemService(Context.WIFI_P2P_SERVICE);
            WifiP2pManager.Channel channel = wifiP2pManager != null ? wifiP2pManager.initialize(ctx, ctx.getMainLooper(), null) : null;

            BleDiscoveryEngine bleEngine = new BleDiscoveryEngine(bluetoothAdapter, localDeviceId);
            bleEngine.setDiscoveryListener(new BleDiscoveryEngine.BleDiscoveryListener() {
                @Override
                public void onPeerDiscovered(String canonicalPeerId, String bleAddress, int rssi) {
                    try {
                        if (localDeviceId.equals(canonicalPeerId)) return;
                        if (bleAddress != null) {
                            connectionManager.registerAlias(bleAddress, canonicalPeerId);
                        }
                        if (roomDataEngine != null) {
                            roomDataEngine.saveContact(new com.blackout.data.entity.ContactEntity(canonicalPeerId, "User #" + canonicalPeerId.substring(Math.max(0, canonicalPeerId.length() - 4)).toUpperCase(), "BLE", bleAddress, System.currentTimeMillis()));
                        }
                        com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();
                        peerMap.putString("peer_id", canonicalPeerId);
                        if (bleAddress != null) {
                            peerMap.putString("transport_address", bleAddress);
                        }
                        peerMap.putString("name", "User #" + canonicalPeerId.substring(Math.max(0, canonicalPeerId.length() - 4)).toUpperCase());
                        peerMap.putString("connection_state", "DISCOVERED");
                        peerMap.putInt("signal_strength", Math.max(0, Math.min(100, (rssi + 100) * 2)));
                        peerMap.putDouble("last_seen_at", System.currentTimeMillis());
                        peerMap.putString("transport", "BLE");

                        com.facebook.react.bridge.WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                        event.putString("type", "PEER_DISCOVERED");
                        event.putMap("peer", peerMap);

                        getReactApplicationContext()
                                .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("NativeEvent", event);
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to emit BLE PEER_DISCOVERED", e);
                    }
                }
            });

            WifiDirectManager wifiManager = new WifiDirectManager(wifiP2pManager, channel, ctx);
            wifiManager.setLocalDeviceId(localDeviceId);
            wifiManager.setDiscoveryCallback(new WifiDirectManager.DiscoveryCallback() {
                @Override
                public void onPeersDiscovered(List<android.net.wifi.p2p.WifiP2pDevice> peers) {
                    try {
                        for (android.net.wifi.p2p.WifiP2pDevice device : peers) {
                            if (device.status == android.net.wifi.p2p.WifiP2pDevice.CONNECTED) continue;
                            String canonicalId = connectionManager != null ? connectionManager.resolveCanonicalId(device.deviceAddress) : device.deviceAddress;
                            boolean hasCanonical = !canonicalId.equals(device.deviceAddress);

                            String friendlyName = device.deviceName;
                            if (friendlyName == null || friendlyName.isEmpty() || friendlyName.equals(device.deviceAddress)) {
                                friendlyName = "Node " + (hasCanonical ? canonicalId.substring(Math.max(0, canonicalId.length() - 4)).toUpperCase() : device.deviceAddress.substring(Math.max(0, device.deviceAddress.length() - 5)));
                            }

                            if (roomDataEngine != null) {
                                roomDataEngine.saveContact(new com.blackout.data.entity.ContactEntity(canonicalId, friendlyName, "WIFI_DIRECT", device.deviceAddress, System.currentTimeMillis()));
                            }

                            com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();
                            peerMap.putString("peer_id", canonicalId);
                            peerMap.putString("transport_address", device.deviceAddress);
                            peerMap.putString("name", friendlyName);
                            peerMap.putString("connection_state", "DISCOVERED");
                            peerMap.putInt("signal_strength", 80);
                            peerMap.putDouble("last_seen_at", System.currentTimeMillis());
                            peerMap.putString("transport", "WIFI_DIRECT");

                            com.facebook.react.bridge.WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                            event.putString("type", "PEER_DISCOVERED");
                            event.putMap("peer", peerMap);

                            getReactApplicationContext()
                                    .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit("NativeEvent", event);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to emit PEER_DISCOVERED", e);
                    }
                }
                @Override
                public void onConnectionStateChanged(String deviceAddress, com.blackout.network.discovery.WifiDirectManager.State state) {
                    if (state == com.blackout.network.discovery.WifiDirectManager.State.CONNECTING) {
                        String canonicalId = connectionManager != null ? connectionManager.resolveCanonicalId(deviceAddress) : deviceAddress;
                        com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();
                        peerMap.putString("peer_id", canonicalId);
                        peerMap.putString("transport_address", deviceAddress);
                        peerMap.putString("connection_state", "CONNECTING");
                        peerMap.putString("transport", "WIFI_DIRECT");
                        com.facebook.react.bridge.WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                        event.putString("type", "PEER_DISCOVERED"); // Was prematurely emitting PEER_CONNECTED
                        event.putMap("peer", peerMap);
                        getReactApplicationContext()
                                .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("NativeEvent", event);
                    }
                }
            });
            wifiManager.setConnectionCallback(new WifiDirectManager.ConnectionCallback() {
                @Override
                public void onClientConnectedToGroupOwner(java.net.Socket socket) {
                    String tempId = "TEMP-CLIENT-" + java.util.UUID.randomUUID().toString().substring(0,8);
                    PeerConnection peer = new PeerConnection(tempId, socket, messageHandler);
                    if (wifiManager.getLastConnectingAddress() != null) {
                        peer.setTransportAddress(wifiManager.getLastConnectingAddress());
                        connectionManager.registerAlias(wifiManager.getLastConnectingAddress(), tempId);
                    }
                    connectionManager.addConnection(peer);
                    
                    peer.start();
                    try {
                        com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();
                        peerMap.putString("peer_id", tempId);
                        peerMap.putString("connection_state", "HANDSHAKING");
                        peerMap.putString("transport", "WIFI_DIRECT");
                        com.facebook.react.bridge.WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                        event.putString("type", "PEER_DISCOVERED");
                        event.putMap("peer", peerMap);
                        getReactApplicationContext().getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("NativeEvent", event);
                    } catch (Exception e) {}
                    // Send dummy bytes to unblock read loop or handshake if needed
                    handshakeManager.initiateHandshake(peer);

                }
            });

            networkEngine = new AndroidNetworkEngine(identity, bleEngine, wifiManager, connectionManager, networkServer);
            
            promise.resolve(identity.getDeviceId());
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e);
        }
    }

    @ReactMethod
    public void startNetworking(Promise promise) {
        try {
            // Start the Foreground Service to keep sockets alive in the background/screen-off
            android.content.Intent serviceIntent = new android.content.Intent(getReactApplicationContext(), com.blackout.network.service.MeshForegroundService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getReactApplicationContext().startForegroundService(serviceIntent);
            } else {
                getReactApplicationContext().startService(serviceIntent);
            }

            if (networkEngine != null) {
                networkEngine.start();
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("START_ERROR", e);
        }
    }

    @ReactMethod
    public void stopNetworking(Promise promise) {
        try {
            if (networkEngine != null) {
                networkEngine.stop();
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("STOP_ERROR", e);
        }
    }

    @ReactMethod
    public void sendMessage(String messageJson, Promise promise) {
        try {
            if (outgoingSendManager == null) {
                promise.reject("ENGINE_NOT_READY", "Initialize the engine first");
                return;
            }
            
            NetworkMessage msg = MessageSerializer.deserialize(messageJson.getBytes(StandardCharsets.UTF_8));
            
            // Wait, MessageSerializer expects snake_case for field names. 
            // In a real production app, we'd ensure React Native sends the snake_case keys correctly.
            boolean sent = false;
            if (msg.getDestinationDeviceId() != null && !msg.getDestinationDeviceId().isEmpty()) {
                boolean directSuccess = outgoingSendManager.sendDirect(msg, msg.getDestinationDeviceId());
                if (directSuccess) {
                    sent = true;
                } else if (connectionManager != null && !connectionManager.getActivePeerIds().isEmpty()) {
                    // Direct socket not open, relay across connected mesh neighbors
                    sent = outgoingSendManager.broadcast(msg);
                }
            } else {
                sent = outgoingSendManager.broadcast(msg);
            }
            
            WritableMap result = Arguments.createMap();
            result.putString("message_id", msg.getMessageId());
            result.putDouble("accepted_at", System.currentTimeMillis());
            result.putString("status", sent ? "SENT" : "QUEUED");
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("SEND_ERROR", e);
        }
    }

    private void emitMessageToJS(NetworkMessage message) {
        try {
            String jsonString = new String(MessageSerializer.serialize(message));
            WritableMap event = Arguments.createMap();
            event.putString("type", "MESSAGE_RECEIVED");
            event.putString("data", jsonString);

            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("NativeEvent", event);
        } catch (Exception e) {
            Log.e(TAG, "Failed to emit message to JS", e);
        }
    }

    private void handleIncomingAck(NetworkMessage message) {
        try {
            String ackTo = null;
            if (message.getPayload() != null && !message.getPayload().isEmpty()) {
                org.json.JSONObject payloadObj = new org.json.JSONObject(message.getPayload());
                ackTo = payloadObj.optString("ack_to");
            }
            if (ackTo != null && !ackTo.isEmpty()) {
                boolean validOrigin = true;
                if (roomDataEngine != null) {
                    com.blackout.data.entity.NetworkMessageEntity originalEntity = roomDataEngine.getMessageEntity(ackTo);
                    if (originalEntity != null && originalEntity.destinationDeviceId != null) {
                        if (!originalEntity.destinationDeviceId.equals(message.getOriginDeviceId())) {
                            Log.w(TAG, "Rejecting forged ACK for " + ackTo + " from unauthorized origin " + message.getOriginDeviceId());
                            validOrigin = false;
                        }
                    }
                }
                if (validOrigin) {
                    if (roomDataEngine != null) {
                        roomDataEngine.markDelivered(ackTo, System.currentTimeMillis());
                    }
                    WritableMap statusMap = Arguments.createMap();
                    statusMap.putString("message_id", ackTo);
                    statusMap.putString("state", "DELIVERED");
                    statusMap.putDouble("updated_at", (double) System.currentTimeMillis());
                    statusMap.putInt("attempts", 1);

                    WritableMap event = Arguments.createMap();
                    event.putString("type", "MESSAGE_DELIVERY_UPDATED");
                    event.putMap("status", statusMap);

                    getReactApplicationContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("NativeEvent", event);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing incoming ACK payload", e);
        }
        emitMessageToJS(message);
    }

    private void handleIncomingDirectMessage(NetworkMessage message) {
        if (roomDataEngine != null) {
            roomDataEngine.saveMessage(message, "RECEIVED");
        }
        emitMessageToJS(message);

        // Auto-generate and send reverse multi-hop delivery ACK back to origin sender
        if (message.getMessageType() == MessageType.DIRECT && message.getOriginDeviceId() != null) {
            try {
                NetworkMessage ackMsg = new NetworkMessage.Builder()
                    .messageId("ack_" + message.getMessageId())
                    .originDeviceId(localDeviceId)
                    .destinationDeviceId(message.getOriginDeviceId())
                    .messageType(MessageType.ACK)
                    .createdAt(System.currentTimeMillis())
                    .ttl(message.getTtl() > 0 ? message.getTtl() : 15)
                    .hopCount(0)
                    .priority("NORMAL")
                    .payload("{\"ack_to\":\"" + message.getMessageId() + "\"}")
                    .payloadHash("")
                    .signature("")
                    .build();

                if (outgoingSendManager != null) {
                    boolean directSent = outgoingSendManager.sendDirect(ackMsg, ackMsg.getDestinationDeviceId());
                    if (!directSent) {
                        outgoingSendManager.broadcast(ackMsg);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to auto-generate ACK for direct message", e);
            }
        }
    }

    @ReactMethod
    public void getDeliveryStatus(String messageId, Promise promise) {
        try {
            if (roomDataEngine != null) {
                com.blackout.data.entity.NetworkMessageEntity entity = roomDataEngine.getMessageEntity(messageId);
                if (entity != null) {
                    WritableMap statusMap = Arguments.createMap();
                    statusMap.putString("message_id", entity.messageId);
                    statusMap.putString("state", entity.deliveryState != null ? entity.deliveryState : "QUEUED");
                    statusMap.putDouble("updated_at", (double) (entity.deliveredAt > 0 ? entity.deliveredAt : entity.createdAt));
                    statusMap.putInt("attempts", 1);
                    promise.resolve(statusMap);
                    return;
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("DELIVERY_STATUS_ERROR", e);
        }
    }

    @ReactMethod
    public void getPeers(Promise promise) {
        try {
            WritableArray peersArray = Arguments.createArray();
            if (networkEngine != null) {
                // Get Wi-Fi Direct discovered peers
                List<android.net.wifi.p2p.WifiP2pDevice> wifiPeers = networkEngine.getWifiPeers();
                for (android.net.wifi.p2p.WifiP2pDevice device : wifiPeers) {
                    if (device.status == android.net.wifi.p2p.WifiP2pDevice.CONNECTED) continue;
                    String canonicalId = connectionManager != null ? connectionManager.resolveCanonicalId(device.deviceAddress) : device.deviceAddress;
                    boolean hasCanonical = !canonicalId.equals(device.deviceAddress);

                    WritableMap peer = Arguments.createMap();
                    peer.putString("peer_id", canonicalId);
                    peer.putString("transport_address", device.deviceAddress);
                    String friendlyName = device.deviceName;
                    if (friendlyName == null || friendlyName.isEmpty() || friendlyName.equals(device.deviceAddress)) {
                        friendlyName = "Node " + (hasCanonical ? canonicalId.substring(Math.max(0, canonicalId.length() - 4)).toUpperCase() : device.deviceAddress.substring(Math.max(0, device.deviceAddress.length() - 5)));
                    }
                    peer.putString("name", friendlyName);
                    peer.putString("connection_state", "DISCOVERED");
                    peer.putInt("signal_strength", 80);
                    peer.putDouble("last_seen_at", System.currentTimeMillis());
                    peer.putString("transport", "WIFI_DIRECT");
                    peersArray.pushMap(peer);
                }
                
                // Get Active TCP Connections
                if (connectionManager != null) {
                    List<String> connectedIds = connectionManager.getActivePeerIds();
                    for (String peerId : connectedIds) {
                        WritableMap peer = Arguments.createMap();
                        peer.putString("peer_id", peerId);
                        String transportAddr = connectionManager.resolveTransportAddress(peerId);
                        if (transportAddr != null && !transportAddr.equals(peerId)) {
                            peer.putString("transport_address", transportAddr);
                        }
                        peer.putString("name", "User #" + peerId.substring(Math.max(0, peerId.length() - 4)).toUpperCase());
                        peer.putString("connection_state", "CONNECTED");
                        peer.putInt("signal_strength", 100);
                        peer.putDouble("last_seen_at", System.currentTimeMillis());
                        peer.putString("transport", "WIFI_DIRECT");
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
    public void connect(String address, Promise promise) {
        try {
            if (networkEngine instanceof AndroidNetworkEngine) {
                WifiDirectManager wdm = ((AndroidNetworkEngine) networkEngine).getWifiDirectManager();
                if (wdm != null) {
                    String targetAddress = address;
                    if (connectionManager != null) {
                        String transport = connectionManager.resolveTransportAddress(address);
                        if (transport != null && transport.contains(":")) {
                            targetAddress = transport;
                        }
                    }
                    wdm.connectToAddress(targetAddress);
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("CONNECT_ERROR", e);
        }
    }

    @ReactMethod
    public void discoverPeers(Promise promise) {
        try {
            if (networkEngine != null) {
                WifiDirectManager wdm = ((AndroidNetworkEngine) networkEngine).getWifiDirectManager();
                if (wdm != null) wdm.discoverPeers();
                promise.resolve(null);
            } else {
                promise.reject("ENGINE_NOT_READY", "Initialize the engine first");
            }
        } catch (Exception e) {
            promise.reject("DISCOVER_ERROR", e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built-in Event Emitter Calls
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built-in Event Emitter Calls
    }

    @ReactMethod
    public void pingNative(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            result.putString("status", "OK");
            result.putBoolean("native", true);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("NATIVE_PING_ERROR", e);
        }
    }
}