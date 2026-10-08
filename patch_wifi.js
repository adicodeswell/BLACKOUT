const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/discovery/WifiDirectManager.java';
let code = fs.readFileSync(path, 'utf8');

const target1 = `    public void setGroupFormed(boolean formed) {`;
const inject1 = `    public List<WifiP2pDevice> getDiscoveredPeers() {
        return new ArrayList<>(peers);
    }

    public void setGroupFormed(boolean formed) {`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
