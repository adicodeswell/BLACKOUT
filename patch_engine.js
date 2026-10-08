const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/engine/AndroidNetworkEngine.java';
let code = fs.readFileSync(path, 'utf8');

const target1 = `import java.io.IOException;`;
const inject1 = `import java.io.IOException;\nimport java.util.ArrayList;\nimport java.util.List;\nimport android.net.wifi.p2p.WifiP2pDevice;`;
code = code.replace(target1, inject1);

const target2 = `    public boolean isRunning() {`;
const inject2 = `    public List<WifiP2pDevice> getWifiPeers() {
        if (wifiManager != null) return wifiManager.getDiscoveredPeers();
        return new ArrayList<>();
    }

    public ConnectionManager getConnectionManager() {
        return connectionManager;
    }

    public boolean isRunning() {`;

code = code.replace(target2, inject2);
fs.writeFileSync(path, code);
