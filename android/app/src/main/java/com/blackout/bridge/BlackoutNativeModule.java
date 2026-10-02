package com.blackout.bridge;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class BlackoutNativeModule extends ReactContextBaseJavaModule {

    public BlackoutNativeModule(
            ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "BlackoutNativeModule";
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