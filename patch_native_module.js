const fs = require('fs');

const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(path, 'utf8');

// Add imports
code = code.replace(
  'import android.util.Log;',
  'import android.util.Log;\nimport android.bluetooth.BluetoothAdapter;\nimport android.bluetooth.BluetoothManager;\nimport android.content.Context;\nimport android.net.wifi.p2p.WifiP2pManager;'
);

// Replace the null injection
const nullInjectionTarget = `// Nulls represent the mocked hardware until Phase 7
            BleDiscoveryEngine bleEngine = new BleDiscoveryEngine(null);
            WifiDirectManager wifiManager = new WifiDirectManager(null, null);`;

const newInjection = `// Inject hardware adapters
            BluetoothManager bluetoothManager = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter bluetoothAdapter = bluetoothManager != null ? bluetoothManager.getAdapter() : null;

            WifiP2pManager wifiP2pManager = (WifiP2pManager) ctx.getSystemService(Context.WIFI_P2P_SERVICE);
            WifiP2pManager.Channel channel = wifiP2pManager != null ? wifiP2pManager.initialize(ctx, ctx.getMainLooper(), null) : null;

            BleDiscoveryEngine bleEngine = new BleDiscoveryEngine(bluetoothAdapter);
            WifiDirectManager wifiManager = new WifiDirectManager(wifiP2pManager, channel, ctx);`;

code = code.replace(nullInjectionTarget, newInjection);

fs.writeFileSync(path, code);
