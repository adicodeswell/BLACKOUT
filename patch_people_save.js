const fs = require('fs');
const file = 'src/services/PeopleService.ts';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `        if (this.dataEngine) {
          this.dataEngine.saveMessage(msg).then(() => {
            processAndAck();
          }).catch(() => {
            // Persistence failed: do not ACK.
            return;
          });
        } else {
          processAndAck();
        }`;

const newLogic = `        if (this.dataEngine) {
          this.dataEngine.saveMessage(msg).then((res) => {
            if (res.ok) {
              processAndAck();
            } else {
              // Persistence failed: do not ACK.
            }
          }).catch(() => {
            // Unexpected error: do not ACK.
            return;
          });
        } else {
          processAndAck();
        }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content, 'utf8');
