const fs = require('fs');
const file = 'android/app/src/main/java/com/blackout/network/transport/ConnectionManager.java';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `        PeerConnection conn = connections.remove(oldId);
        if (conn != null) {
            conn.setPeerId(newId);
            connections.put(newId, conn);
            Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        }`,
  `        PeerConnection conn = connections.remove(oldId);
        if (conn != null) {
            if (connections.containsKey(newId)) {
                Log.w(TAG, "Replacing existing connection during rename for peer: " + newId);
                PeerConnection old = connections.remove(newId);
                if (old != null) {
                    old.disconnect();
                }
            }
            conn.setPeerId(newId);
            connections.put(newId, conn);
            Log.i(TAG, "Renamed connection " + oldId + " to " + newId);
        }`
);
fs.writeFileSync(file, content);
