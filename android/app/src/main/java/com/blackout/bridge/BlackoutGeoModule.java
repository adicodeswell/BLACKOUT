package com.blackout.bridge;

import android.annotation.SuppressLint;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;

import com.blackout.geolocation.LocationValidator;
import com.blackout.geolocation.OfflineGeoEngine;
import com.blackout.geolocation.OfflineMapManager;
import com.blackout.geolocation.model.GeoPoint;
import com.blackout.geolocation.model.RouteComputation;
import com.blackout.geolocation.AStarRouter;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.List;

public class BlackoutGeoModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BlackoutGeoModule";
    private OfflineGeoEngine geoEngine;
    private LocationManager locationManager;
    private Location lastKnownLocation;
    private boolean isTracking = false;

    public BlackoutGeoModule(ReactApplicationContext reactContext) {
        super(reactContext);
        locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
    }

    @NonNull
    @Override
    public String getName() {
        return "BlackoutGeoModule";
    }

    private final LocationListener androidLocationListener = new LocationListener() {
        @Override
        public void onLocationChanged(@NonNull Location location) {
            lastKnownLocation = location;
            emitLocationEvent(location);
        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {}

        @Override
        public void onProviderEnabled(@NonNull String provider) {}

        @Override
        public void onProviderDisabled(@NonNull String provider) {}
    };

    private void emitLocationEvent(Location location) {
        try {
            WritableMap payload = Arguments.createMap();
            payload.putDouble("latitude", location.getLatitude());
            payload.putDouble("longitude", location.getLongitude());
            payload.putDouble("accuracy", location.getAccuracy());
            payload.putDouble("altitude", location.getAltitude());
            payload.putDouble("timestamp", location.getTime());
            
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("LOCATION_UPDATED", payload);
        } catch (Exception e) {
            Log.e(TAG, "Failed to emit location", e);
        }
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            if (geoEngine != null) {
                promise.resolve(null);
                return;
            }

            locationManager = (LocationManager) getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);

            OfflineGeoEngine.LocationProvider provider = new OfflineGeoEngine.LocationProvider() {
                @Override
                public OfflineGeoEngine.LocationSample getCurrentLocation() {
                    if (lastKnownLocation == null) return null;
                    return new OfflineGeoEngine.LocationSample(lastKnownLocation.getLatitude(), lastKnownLocation.getLongitude(), lastKnownLocation.getAccuracy(), lastKnownLocation.getTime());
                }

                @Override
                public Runnable observe(OfflineGeoEngine.LocationListener listener) {
                    // Not heavily used if React Native manages state, but implemented for contract
                    return () -> {}; 
                }
            };

            LocationValidator validator = new LocationValidator();
            OfflineMapManager mapManager = new OfflineMapManager(java.util.Collections.emptyList());

            geoEngine = new OfflineGeoEngine(provider, validator, mapManager);

            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("GEO_INIT_ERROR", e);
        }
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    public void startTracking(Promise promise) {
        try {
            if (locationManager != null && !isTracking) {
                // Requesting from GPS for off-grid capabilities
                
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        2000, 5f, androidLocationListener
                );
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                            LocationManager.NETWORK_PROVIDER,
                            2000, 5f, androidLocationListener
                    );
                }

                
                
                
                Location loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (loc == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }

                if (loc == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }

                if (loc != null) {
                    lastKnownLocation = loc;
                }
                
                isTracking = true;
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("TRACKING_ERROR", e);
        }
    }

    @ReactMethod
    public void stopTracking(Promise promise) {
        try {
            if (locationManager != null && isTracking) {
                locationManager.removeUpdates(androidLocationListener);
                isTracking = false;
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("TRACKING_STOP_ERROR", e);
        }
    }

    @ReactMethod
    public void getCurrentLocation(Promise promise) {
        try {
            if (lastKnownLocation == null && locationManager != null) {
                @SuppressLint("MissingPermission")
                Location loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (loc == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
                if (loc != null) lastKnownLocation = loc;
            }

            if (lastKnownLocation != null) {
                WritableMap locMap = Arguments.createMap();
                locMap.putDouble("latitude", lastKnownLocation.getLatitude());
                locMap.putDouble("longitude", lastKnownLocation.getLongitude());
                locMap.putDouble("accuracy", lastKnownLocation.getAccuracy());
                locMap.putDouble("altitude", lastKnownLocation.getAltitude());
                locMap.putDouble("timestamp", lastKnownLocation.getTime());
                promise.resolve(locMap);
            } else {
                
promise.reject("UNAVAILABLE", "Location not yet acquired (waiting for sensor lock)");

            }
        } catch (Exception e) {
            promise.reject("GET_LOCATION_ERROR", e);
        }
    }

    @ReactMethod
    public void calculateRoute(ReadableMap start, ReadableMap dest, ReadableMap options, Promise promise) {
        try {
            if (geoEngine == null) {
                promise.reject("NOT_INITIALIZED", "GeoEngine not initialized");
                return;
            }

            GeoPoint pStart = new GeoPoint(start.getDouble("latitude"), start.getDouble("longitude"));
            GeoPoint pDest = new GeoPoint(dest.getDouble("latitude"), dest.getDouble("longitude"));
            
            // Simplified route calculation mapping to Member 3's engine
            RouteComputation result = geoEngine.calculateRoute(
                    pStart,
                    pDest,
                    new AStarRouter.Options(true, true, 5, 200)
            );

            if (result != null) {
                WritableMap out = Arguments.createMap();
                out.putDouble("distance_m", result.getDistanceM());
                out.putDouble("duration_s", result.getDurationS());
                
                WritableArray path = Arguments.createArray();
                for (GeoPoint pt : result.getGeometry()) {
                    WritableMap ptMap = Arguments.createMap();
                    ptMap.putDouble("latitude", pt.getLatitude());
                    ptMap.putDouble("longitude", pt.getLongitude());
                    path.pushMap(ptMap);
                }
                out.putArray("path", path);
                
                promise.resolve(out);
            } else {
                promise.reject("ROUTE_ERROR", "Failed to find a viable route");
            }

        } catch (Exception e) {
            promise.reject("CALC_ROUTE_ERROR", e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) { }

    @ReactMethod
    public void removeListeners(Integer count) { }
}
