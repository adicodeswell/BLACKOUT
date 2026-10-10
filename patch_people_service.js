const fs = require('fs');
const file = 'src/services/PeopleService.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `      if (msg.message_type === "DIRECT" || msg.message_type === "BROADCAST") {
        const peerId = msg.origin_device_id || "unknown-node";

        const onSaved = () => {
          if (msg.message_type === "DIRECT" && msg.origin_device_id) {
             const ackMsg: MessageDto = {
               protocol_version: 1,
               message_id: "ack_" + msg.message_id,
               origin_device_id: this.localNodeId,
               destination_device_id: msg.origin_device_id,
               message_type: "ACK",
               created_at: Date.now(),
               ttl: 1, hop_count: 0, priority: "NORMAL",
               payload_hash: "", payload: { ack_to: msg.message_id }, signature: ""
             };
             this.networkEngine.send(ackMsg);
          }
          this.addMessageToConversation(peerId, msg);
        };

        if (this.dataEngine) {
          this.dataEngine.saveMessage(msg).then(() => {
            onSaved();
          }).catch(() => {
            // still try to add it in memory even if saving fails?
            // Actually if it fails, maybe we shouldn't ACK, but let's be safe.
            onSaved();
          });
        } else {
          onSaved();
        }
      }`;

const replacement = `      if (msg.message_type === "DIRECT" || msg.message_type === "BROADCAST") {
        const peerId = msg.origin_device_id || "unknown-node";
        
        const processAndAck = () => {
          this.addMessageToConversation(peerId, msg);
          if (msg.message_type === "DIRECT" && msg.origin_device_id) {
             const ackMsg: MessageDto = {
               protocol_version: 1,
               message_id: "ack_" + msg.message_id,
               origin_device_id: this.localNodeId,
               destination_device_id: msg.origin_device_id,
               message_type: "ACK",
               created_at: Date.now(),
               ttl: 1, hop_count: 0, priority: "NORMAL",
               payload_hash: "", payload: { ack_to: msg.message_id }, signature: ""
             };
             this.networkEngine.send(ackMsg);
          }
        };

        if (this.dataEngine) {
          this.dataEngine.saveMessage(msg).then(() => {
            processAndAck();
          }).catch(() => {
            // Persistence failed: do not ACK.
            return;
          });
        } else {
          processAndAck();
        }
      }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
