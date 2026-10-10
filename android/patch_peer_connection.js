const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/transport/PeerConnection.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('private volatile boolean isConnected = false;', `private volatile boolean isConnected = false;
    private volatile boolean isReady = false;`);

code = code.replace('public void setPeerId(String newId) {', `public boolean isReady() {
        return isReady;
    }
    public void setReady(boolean ready) {
        this.isReady = ready;
    }

    public void setPeerId(String newId) {`);

fs.writeFileSync(file, code);
