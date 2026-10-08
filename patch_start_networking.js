const fs = require('fs');

const nativeModulePath = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(nativeModulePath, 'utf8');

// Update startNetworking to take nodeId
code = code.replace(
    'public void startNetworking(Promise promise) {',
    'public void startNetworking(String nodeId, Promise promise) {'
);

code = code.replace(
    'handshakeManager = new HandshakeManager("self-node-01", connectionManager);',
    'handshakeManager = new HandshakeManager(nodeId, connectionManager);'
);
fs.writeFileSync(nativeModulePath, code);

// Update TS adapter
const adapterPath = 'src/adapters/network/NativeNetworkEngineAdapter.ts';
let adapterCode = fs.readFileSync(adapterPath, 'utf8');
adapterCode = adapterCode.replace(
    'startNetworking(): Promise<void>;',
    'startNetworking(nodeId: string): Promise<void>;'
);
adapterCode = adapterCode.replace(
    'return this.bridge.startNetworking();',
    'return this.bridge.startNetworking(this.localNodeId || "node_" + Math.random().toString(36).substring(2,9));'
);
adapterCode = adapterCode.replace(
    'export class NativeNetworkEngineAdapter implements NetworkEngine {',
    'export class NativeNetworkEngineAdapter implements NetworkEngine {\n  public localNodeId: string = "";'
);
fs.writeFileSync(adapterPath, adapterCode);

// Update PeopleService to set it!
const peopleServicePath = 'src/services/PeopleService.ts';
let psCode = fs.readFileSync(peopleServicePath, 'utf8');
psCode = psCode.replace(
    'this.networkEngine = networkEngine;',
    'this.networkEngine = networkEngine;\n    if ((this.networkEngine as any).localNodeId !== undefined) { (this.networkEngine as any).localNodeId = this.localNodeId; }'
);
fs.writeFileSync(peopleServicePath, psCode);

