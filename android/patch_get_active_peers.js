const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/transport/ConnectionManager.java';
let code = fs.readFileSync(file, 'utf8');

const target = `    public synchronized List<String> getActivePeerIds() {
        List<String> activeIds = new ArrayList<>();
        for (String id : connections.keySet()) {
            if (!id.startsWith("TEMP-")) {
                activeIds.add(id);
            }
        }
        return activeIds;
    }`;

const replacement = `    public synchronized List<String> getActivePeerIds() {
        List<String> activeIds = new ArrayList<>();
        for (PeerConnection conn : connections.values()) {
            if (conn.isReady()) {
                activeIds.add(conn.getPeerId());
            }
        }
        return activeIds;
    }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
