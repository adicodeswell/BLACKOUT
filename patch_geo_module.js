const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

const target1 = `    @ReactMethod
    public void calculateRoute(`;

const inject1 = `    @ReactMethod
    public void getHazards(String regionJson, Promise promise) {
        try {
            org.json.JSONArray arr = new org.json.JSONArray();
            promise.resolve(arr.toString());
        } catch (Exception e) {
            promise.reject("GET_HAZARDS_ERROR", e);
        }
    }

    @ReactMethod
    public void findNearby(String type, String locationJson, Double radiusM, Promise promise) {
        try {
            org.json.JSONArray arr = new org.json.JSONArray();
            promise.resolve(arr.toString());
        } catch (Exception e) {
            promise.reject("FIND_NEARBY_ERROR", e);
        }
    }

    @ReactMethod
    public void loadOfflineMap(String regionJson, Promise promise) {
        try {
            org.json.JSONObject result = new org.json.JSONObject();
            result.put("status", "LOADED");
            result.put("offlineReady", true);
            // In a full implementation, we'd extract .mbtiles here
            promise.resolve(result.toString());
        } catch (Exception e) {
            promise.reject("LOAD_OFFLINE_ERROR", e);
        }
    }

    @ReactMethod
    public void calculateRoute(`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
