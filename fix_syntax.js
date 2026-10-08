const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/transport/PeerConnection.java';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
\`    public String getPeerId() {
        return peerId;
    }
}

    public void setPeerId(String newId) {
        this.peerId = newId;
    }
\`,
\`    public String getPeerId() {
        return peerId;
    }

    public void setPeerId(String newId) {
        this.peerId = newId;
    }
}
\`);

fs.writeFileSync(path, code);
