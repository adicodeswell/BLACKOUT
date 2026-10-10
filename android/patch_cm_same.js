const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/transport/ConnectionManager.java';
let code = fs.readFileSync(file, 'utf8');

const target = `    public synchronized boolean updateConnectionId(String oldId, String newId, String localDeviceId) {
        PeerConnection conn = connections.get(oldId);
        if (conn == null) return false;

        PeerConnection existing = connections.get(newId);`;

const replacement = `    public synchronized boolean updateConnectionId(String oldId, String newId, String localDeviceId) {
        PeerConnection conn = connections.get(oldId);
        if (conn == null) return false;
        
        if (oldId.equals(newId)) {
            return true;
        }

        PeerConnection existing = connections.get(newId);`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
