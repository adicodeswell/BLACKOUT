package com.blackout.network.discovery;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.os.ParcelUuid;
import android.util.Log;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Handles Bluetooth Low Energy (BLE) background advertising and scanning.
 * Emits tiny beacons to find nearby BLACKOUT peers without draining the battery.
 */
public class BleDiscoveryEngine {
    private static final String TAG = "BleDiscoveryEngine";

    // 128-bit UUID unique to BLACKOUT Mesh Network
    public static final ParcelUuid BLACKOUT_SERVICE_UUID = new ParcelUuid(UUID.fromString("B1A00000-0000-1000-8000-00805F9B34FB"));

    private final BluetoothAdapter bluetoothAdapter;
    private BluetoothLeAdvertiser advertiser;
    private BluetoothLeScanner scanner;
    
    private boolean isDiscovering = false;

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            Log.i(TAG, "BLE Advertising started successfully.");
        }

        @Override
        public void onStartFailure(int errorCode) {
            Log.e(TAG, "BLE Advertising failed: " + errorCode);
        }
    };

    private final ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            super.onScanResult(callbackType, result);
            Log.i(TAG, "Found BLACKOUT peer via BLE: " + result.getDevice().getAddress());
            // Triggers Wi-Fi Direct or GATT connection logic in a production scenario
        }

        @Override
        public void onBatchScanResults(List<ScanResult> results) {
            for (ScanResult result : results) {
                Log.i(TAG, "Found BLACKOUT peer via BLE (Batch): " + result.getDevice().getAddress());
            }
        }

        @Override
        public void onScanFailed(int errorCode) {
            Log.e(TAG, "BLE Scan failed: " + errorCode);
        }
    };

    public BleDiscoveryEngine(BluetoothAdapter adapter) {
        this.bluetoothAdapter = adapter;
    }

    @SuppressLint("MissingPermission")
    public void start() throws Exception {
        if (isDiscovering) return;
        
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Log.e(TAG, "Bluetooth is not supported or not enabled.");
            throw new Exception("BLUETOOTH_DISABLED");
        }

        advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        scanner = bluetoothAdapter.getBluetoothLeScanner();

        if (advertiser != null && scanner != null) {
            Log.i(TAG, "Starting BLE passive discovery and advertising.");
            
            // Start Advertising
            AdvertiseSettings settings = new AdvertiseSettings.Builder()
                    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_POWER)
                    .setConnectable(true)
                    .setTimeout(0)
                    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_LOW)
                    .build();

            AdvertiseData data = new AdvertiseData.Builder()
                    .setIncludeDeviceName(false)
                    .addServiceUuid(BLACKOUT_SERVICE_UUID)
                    .build();

            advertiser.startAdvertising(settings, data, advertiseCallback);

            // Start Scanning
            ScanFilter filter = new ScanFilter.Builder()
                    .setServiceUuid(BLACKOUT_SERVICE_UUID)
                    .build();

            ScanSettings scanSettings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
                    .build();

            scanner.startScan(Collections.singletonList(filter), scanSettings, scanCallback);
            isDiscovering = true;
        } else {
            Log.e(TAG, "BLE Advertising/Scanning not supported on this hardware.");
        }
    }

    @SuppressLint("MissingPermission")
    public void stop() {
        if (!isDiscovering) return;
        
        Log.i(TAG, "Stopping BLE passive discovery.");
        if (advertiser != null) {
            advertiser.stopAdvertising(advertiseCallback);
        }
        if (scanner != null) {
            scanner.stopScan(scanCallback);
        }
        isDiscovering = false;
    }

    public boolean isDiscovering() {
        return isDiscovering;
    }
}
