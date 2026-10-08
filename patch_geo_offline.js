const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

const target1 = `    @ReactMethod
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
    }`;

const inject1 = `    @ReactMethod
    public void loadOfflineMap(String regionJson, Promise promise) {
        try {
            android.content.Context ctx = getReactApplicationContext();
            java.io.File outFile = new java.io.File(ctx.getFilesDir(), "kolkata.mbtiles");
            
            // Copy from assets to local file system if it doesn't exist
            if (!outFile.exists()) {
                try (java.io.InputStream in = ctx.getAssets().open("kolkata.mbtiles");
                     java.io.OutputStream out = new java.io.FileOutputStream(outFile)) {
                    byte[] buffer = new byte[1024];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                }
            }

            org.json.JSONObject result = new org.json.JSONObject();
            result.put("status", "LOADED");
            result.put("offlineReady", true);
            result.put("path", outFile.getAbsolutePath());
            
            promise.resolve(result.toString());
        } catch (Exception e) {
            promise.reject("LOAD_OFFLINE_ERROR", e);
        }
    }`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
