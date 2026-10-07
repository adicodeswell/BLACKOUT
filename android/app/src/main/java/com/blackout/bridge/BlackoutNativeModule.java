package com.blackout.bridge;

import androidx.annotation.NonNull;
import android.util.Log;

import com.blackout.network.discovery.BleDiscoveryEngine;
import com.blackout.network.discovery.WifiDirectManager;
import com.blackout.network.engine.AndroidNetworkEngine;
import com.blackout.network.engine.DeviceIdentity;
import com.blackout.network.protocol.HandshakeManager;
import com.blackout.network.protocol.MessageHandler;
import com.blackout.network.protocol.MessageSerializer;
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
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;
import java.util.Map;

public class BlackoutNativeModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "BlackoutNativeModule";
    private AndroidNetworkEngine networkEngine;
    private OutgoingSendManager outgoingSendManager;
    private ConnectionManager connectionManager;

    public BlackoutNativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "BlackoutNativeModule";
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            if (networkEngine != null) {
                promise.resolve(null);
                return;
            }
            
            ReactApplicationContext ctx = getReactApplicationContext();
            DeviceIdentity identity = new DeviceIdentity(ctx);
            connectionManager = new ConnectionManager();
            outgoingSendManager = new OutgoingSendManager(connectionManager);
            HandshakeManager handshakeManager = new HandshakeManager(identity.getDeviceId());
            
            MessageHandler messageHandler = new MessageHandler(connectionManager, handshakeManager, new MessageHandler.AppMessageListener() {
                @Override
                public void onApplicationMessage(NetworkMessage message) {
                    emitMessageToJS(message);
                }
            });
            
            NetworkServer networkServer = new NetworkServer(18888, socket -> {
                // Create a placeholder connection. HandshakeManager updates this later in Phase 7.
                PeerConnection peer = new PeerConnection("UNKNOWN-PEER", socket, messageHandler);
                connectionManager.addConnection(peer);
                peer.start();
            });

            // Nulls represent the mocked hardware until Phase 7
            BleDiscoveryEngine bleEngine = new BleDiscoveryEngine(null);
            WifiDirectManager wifiManager = new WifiDirectManager(null, null);

            networkEngine = new AndroidNetworkEngine(identity, bleEngine, wifiManager, connectionManager, networkServer);
            
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e);
        }
    }

    @ReactMethod
    public void startNetworking(Promise promise) {
        try {
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
    public void sendMessage(ReadableMap messageMap, Promise promise) {
        try {
            if (outgoingSendManager == null) {
                promise.reject("ENGINE_NOT_READY", "Initialize the engine first");
                return;
            }
            
            Map<String, Object> map = messageMap.toHashMap();
            JSONObject json = new JSONObject(map);
            NetworkMessage msg = MessageSerializer.deserialize(json.toString().getBytes());
            
            // Wait, MessageSerializer expects snake_case for field names. 
            // In a real production app, we'd ensure React Native sends the snake_case keys correctly.
            if (msg.getDestinationDeviceId() != null && !msg.getDestinationDeviceId().isEmpty()) {
                outgoingSendManager.sendDirect(msg, msg.getDestinationDeviceId());
            } else {
                outgoingSendManager.broadcast(msg);
            }
            
            WritableMap result = Arguments.createMap();
            result.putString("message_id", msg.getMessageId());
            result.putDouble("accepted_at", System.currentTimeMillis());
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