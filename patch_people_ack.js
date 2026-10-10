const fs = require('fs');
const file = 'src/services/PeopleService.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `        const ackTo = (msg.payload as any).ack_to;
        if (ackTo && this.dataEngine) {
          this.dataEngine.markDelivered(ackTo, Date.now()).catch(() => {});
        }`,
  `        const ackTo = (msg.payload as any).ack_to;
        if (ackTo) {
          if (this.dataEngine) {
            this.dataEngine.markDelivered(ackTo, Date.now()).catch(() => {});
          }
          // Update in-memory state
          this.conversations.forEach((list, peerId) => {
            const m = list.find(x => x.message_id === ackTo);
            if (m) {
              (m as any)._local_delivery_state = 'DELIVERED';
              this.notifyMessageListeners(peerId, m);
            }
          });
        }`
);
fs.writeFileSync(file, content);
