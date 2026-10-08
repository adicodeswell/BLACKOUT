const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    'peer.putString("name", "Mesh Node " + peerId.substring(0, Math.min(4, peerId.length())));',
    'peer.putString("name", "Node " + peerId.substring(Math.max(0, peerId.length() - 4)));'
);

fs.writeFileSync(path, code);
