const fs = require('fs');

// 1. Fix NativeBridgeAdapter.ts
const bridgePath = 'src/adapters/native/NativeBridgeAdapter.ts';
let bridgeCode = fs.readFileSync(bridgePath, 'utf8');

bridgeCode = bridgeCode.replace(
    'async initialize(): Promise<Result<void>> {',
    'async initialize(nodeId: string): Promise<Result<void>> {'
);
bridgeCode = bridgeCode.replace(
    'await BlackoutNativeModule.initialize();',
    'await BlackoutNativeModule.initialize(nodeId);'
);

fs.writeFileSync(bridgePath, bridgeCode);

// 2. Fix NativeNetworkEngineAdapter.ts
const adapterPath = 'src/adapters/network/NativeNetworkEngineAdapter.ts';
let adapterCode = fs.readFileSync(adapterPath, 'utf8');

adapterCode = adapterCode.replace(
    'const initRes = await this.bridge.initialize();',
    'const initRes = await this.bridge.initialize(this.localNodeId || "node_" + Math.random().toString(36).substring(2,9));'
);

fs.writeFileSync(adapterPath, adapterCode);

