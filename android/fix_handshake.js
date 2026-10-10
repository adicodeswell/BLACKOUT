const fs = require('fs');
const file = 'app/src/main/java/com/blackout/network/protocol/HandshakeManager.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/boolean promoted = /g, 'boolean promoted_temp = ');
code = code.replace(/boolean promoted_temp = connectionManager\.updateConnectionId/g, function(match, offset, original) {
    if (offset > original.indexOf('case HELLO_ACK:')) {
        return 'boolean promoted2 = connectionManager.updateConnectionId';
    }
    return 'boolean promoted1 = connectionManager.updateConnectionId';
});
code = code.replace(/if \(\!promoted_temp\) return;/g, function(match, offset, original) {
    if (offset > original.indexOf('case HELLO_ACK:')) {
        return 'if (!promoted2) return;';
    }
    return 'if (!promoted1) return;';
});

fs.writeFileSync(file, code);
