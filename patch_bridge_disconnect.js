const fs = require('fs');
const path = 'src/adapters/native/NativeBridgeAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const oldParse = `      if (rawEvent.type === 'MESSAGE_RECEIVED' && rawEvent.data) {
        const parsedMessage = JSON.parse(rawEvent.data) as MessageDto;
        listener({
          type: 'NETWORK',
          event: {
            type: 'MESSAGE_RECEIVED',
            message: parsedMessage,
          }
        });
      }`;

const newParse = `      if (rawEvent.type === 'MESSAGE_RECEIVED' && rawEvent.data) {
        const parsedMessage = JSON.parse(rawEvent.data) as MessageDto;
        listener({
          type: 'NETWORK',
          event: {
            type: 'MESSAGE_RECEIVED',
            message: parsedMessage,
          }
        });
      } else if (rawEvent.type === 'PEER_DISCONNECTED' && rawEvent.peer_id) {
        listener({
          type: 'NETWORK',
          event: {
            type: 'PEER_DISCONNECTED',
            peer_id: rawEvent.peer_id,
          }
        });
      }`;

code = code.replace(oldParse, newParse);

fs.writeFileSync(path, code);
