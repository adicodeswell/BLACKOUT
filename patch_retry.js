const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/discovery/WifiDirectManager.java';
let code = fs.readFileSync(path, 'utf8');

const importRegex = /import android\.util\.Log;/;
const addHandlerImport = `import android.util.Log;\nimport android.os.Handler;\nimport android.os.Looper;`;
code = code.replace(importRegex, addHandlerImport);

const retryLogicOld = `    @SuppressLint("MissingPermission")
    public void discoverPeers() {
        if (p2pManager == null || channel == null) return;`;

const retryLogicNew = `    private final Handler discoveryHandler = new Handler(Looper.getMainLooper());
    private final Runnable discoveryRunnable = new Runnable() {
        @Override
        public void run() {
            if (p2pManager != null && channel != null && !isGroupFormed) {
                Log.i(TAG, "Aggressive Mesh Retry: Restarting Wi-Fi Direct Discovery...");
                discoverPeersInternal();
            }
            // Retry every 15 seconds to find new nodes walking into range
            discoveryHandler.postDelayed(this, 15000);
        }
    };

    @SuppressLint("MissingPermission")
    public void discoverPeers() {
        if (p2pManager == null || channel == null) return;
        
        // Start the continuous aggressive retry loop
        discoveryHandler.removeCallbacks(discoveryRunnable);
        discoveryHandler.post(discoveryRunnable);
    }

    @SuppressLint("MissingPermission")
    private void discoverPeersInternal() {`;

code = code.replace(retryLogicOld, retryLogicNew);

const stopOld = `    public void stop() {
        if (receiver != null && context != null) {`;
const stopNew = `    public void stop() {
        discoveryHandler.removeCallbacks(discoveryRunnable);
        if (receiver != null && context != null) {`;
        
code = code.replace(stopOld, stopNew);

fs.writeFileSync(path, code);
