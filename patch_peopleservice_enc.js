const fs = require('fs');
const path = 'src/services/PeopleService.ts';
let code = fs.readFileSync(path, 'utf8');

const oldPayload = `      priority: "NORMAL",
      payload_hash: simpleHash(messageText),
      payload: { text: messageText },
      signature: "sig_local_dev",
    };`;

const newPayload = `      priority: "NORMAL",
      payload_hash: simpleHash(messageText),
      payload: { text: messageText },
      encryption: {
        algorithm: "AES_GCM",
        key_id: "default-mesh-key",
        nonce: "1234567890abcdef"
      },
      signature: "sig_local_dev",
    };`;

code = code.replace(oldPayload, newPayload);

fs.writeFileSync(path, code);
