const fs = require('fs');

// 1. Update HandshakeManager.java
const hsPath = 'android/app/src/main/java/com/blackout/network/protocol/HandshakeManager.java';
let hs = fs.readFileSync(hsPath, 'utf8');
hs = hs.replace('private final String localDeviceId;', 'private final String localDeviceId;\n    private final ConnectionManager connectionManager;');
hs = hs.replace(
'    public HandshakeManager(String localDeviceId) {\n        this.localDeviceId = localDeviceId;\n    }',
'    public HandshakeManager(String localDeviceId, ConnectionManager connectionManager) {\n        this.localDeviceId = localDeviceId;\n        this.connectionManager = connectionManager;\n    }'
);
fs.writeFileSync(hsPath, hs);

// 2. Update BlackoutNativeModule.java
const bmPath = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let bm = fs.readFileSync(bmPath, 'utf8');
bm = bm.replace(
    'HandshakeManager handshakeManager = new HandshakeManager(identity.getDeviceId());',
    'HandshakeManager handshakeManager = new HandshakeManager(nodeId, connectionManager);'
);
fs.writeFileSync(bmPath, bm);

