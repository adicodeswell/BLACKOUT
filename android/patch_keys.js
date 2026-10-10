const fs = require('fs');
const file = 'app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/peerMap\.putDouble\("last_seen",/g, 'peerMap.putDouble("last_seen_at",');
code = code.replace(/peerMap\.putString\("transport_type",/g, 'peerMap.putString("transport",');

code = code.replace(/peer\.putDouble\("last_seen",/g, 'peer.putDouble("last_seen_at",');
code = code.replace(/peer\.putString\("transport_type",/g, 'peer.putString("transport",');

fs.writeFileSync(file, code);
