const fs = require('fs');

// 1. Fix Native Module
const nativePath = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let nativeCode = fs.readFileSync(nativePath, 'utf8');

// Revert startNetworking
nativeCode = nativeCode.replace(
    'public void startNetworking(String nodeId, Promise promise) {',
    'public void startNetworking(Promise promise) {'
);

// Update initialize
nativeCode = nativeCode.replace(
    'public void initialize(Promise promise) {',
    'public void initialize(String nodeId, Promise promise) {'
);

fs.writeFileSync(nativePath, nativeCode);

// 2. Fix TS adapter
const tsPath = 'src/adapters/network/NativeNetworkEngineAdapter.ts';
let tsCode = fs.readFileSync(tsPath, 'utf8');

tsCode = tsCode.replace(
    'startNetworking(nodeId: string): Promise<void>;',
    'startNetworking(): Promise<void>;'
);

tsCode = tsCode.replace(
    'return this.bridge.startNetworking(this.localNodeId || "node_" + Math.random().toString(36).substring(2,9));',
    'return this.bridge.startNetworking();'
);

tsCode = tsCode.replace(
    'initialize(): Promise<void>;',
    'initialize(nodeId: string): Promise<void>;'
);

tsCode = tsCode.replace(
    'return this.bridge.initialize();',
    'return this.bridge.initialize(this.localNodeId || "node_" + Math.random().toString(36).substring(2,9));'
);

fs.writeFileSync(tsPath, tsCode);

