const fs = require('fs');
const path = 'src/adapters/network/NativeNetworkEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    'initializeEngine(): Promise<void>;',
    'initializeEngine(nodeId: string): Promise<void>;'
);

code = code.replace(
    'return this.bridge.initializeEngine();',
    'return this.bridge.initializeEngine(this.localNodeId || "node_" + Math.random().toString(36).substring(2,9));'
);

fs.writeFileSync(path, code);
