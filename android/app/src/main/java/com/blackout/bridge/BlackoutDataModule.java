package com.blackout.bridge;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.blackout.data.RoomDataEngine;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageSerializer;

import java.nio.charset.StandardCharsets;

public class BlackoutDataModule extends ReactContextBaseJavaModule {

    private final RoomDataEngine dataEngine;

    public BlackoutDataModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.dataEngine = new RoomDataEngine(reactContext.getApplicationContext());
    }

    @NonNull
    @Override
    public String getName() {
        return "BlackoutDataModule";
    }

    @ReactMethod
    public void saveMessage(String messageJson, Promise promise) {
        try {
            NetworkMessage msg = MessageSerializer.deserialize(messageJson.getBytes(StandardCharsets.UTF_8));
            dataEngine.saveMessage(msg);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SAVE_MESSAGE_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getMessage(String messageId, Promise promise) {
        try {
            NetworkMessage msg = dataEngine.getMessage(messageId);
            if (msg != null) {
                String jsonStr = new String(MessageSerializer.serialize(msg), StandardCharsets.UTF_8);
                promise.resolve(jsonStr);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("GET_MESSAGE_ERROR", e.getMessage(), e);
        }
    }
}
