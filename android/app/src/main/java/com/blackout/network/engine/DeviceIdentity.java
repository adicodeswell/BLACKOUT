package com.blackout.network.engine;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.UUID;

/**
 * Ensures the device has a stable, unique ID across app restarts.
 */
public class DeviceIdentity {
    private static final String PREF_NAME = "blackout_identity";
    private static final String KEY_DEVICE_ID = "device_id";

    private final String deviceId;

    public DeviceIdentity(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String id = prefs.getString(KEY_DEVICE_ID, null);
        
        if (id == null) {
            id = UUID.randomUUID().toString();
            prefs.edit().putString(KEY_DEVICE_ID, id).apply();
        }
        
        this.deviceId = id;
    }

    // Constructor for testing
    public DeviceIdentity(String mockId) {
        this.deviceId = mockId;
    }

    public String getDeviceId() {
        return deviceId;
    }
}
