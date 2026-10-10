const fs = require('fs');
const file = 'src/services/EmergencyReportService.ts';
let code = fs.readFileSync(file, 'utf8');

const targetAck = `        if (msg.message_type === "ACK" && msg.payload) {
          const ackTo = (msg.payload as any).ack_to;
          if (ackTo) {
             this.dataEngine.markDelivered(ackTo, Date.now()).catch(() => {});
          }
        }`;

const replacementAck = `        if (msg.message_type === "ACK" && msg.payload) {
          const ackTo = (msg.payload as any).ack_to;
          if (ackTo) {
             this.dataEngine.getMessage(ackTo).then((res) => {
                // For broadcast reports, the origin checking might not perfectly apply, but if it was directed, we check.
                if (res.ok && res.data && (!res.data.destination_device_id || res.data.destination_device_id === msg.origin_device_id)) {
                  this.dataEngine.markDelivered(ackTo, Date.now()).catch(() => {});
                }
             });
          }
        }`;

code = code.replace(targetAck, replacementAck);

const targetReport = `        if (msg.message_type === 'REPORT' && msg.payload) {
          try {
            // Save incoming mesh reports into our local SQLite
            await this.dataEngine.createReport(msg.payload as any);
            
            // Send ACK back
            const ackMsg: MessageDto = {
              protocol_version: 1,
              message_id: "ack_" + msg.message_id,
              origin_device_id: (this.networkEngine as any).localNodeId || "unknown",
              destination_device_id: msg.origin_device_id,
              message_type: "ACK",
              created_at: Date.now(),
              ttl: 1,
              hop_count: 0,
              priority: "NORMAL",
              payload_hash: "",
              payload: { ack_to: msg.message_id },
              signature: ""
            };
            this.networkEngine.send(ackMsg);
          } catch (e) {
            console.error('Failed to save incoming mesh report', e);
          }
        }`;

const replacementReport = `        if (msg.message_type === 'REPORT' && msg.payload) {
          try {
            const reportPayload = msg.payload as any;
            const reportId = reportPayload.report_id || msg.message_id;
            
            const existing = await this.dataEngine.getIncident(reportId);
            if (!existing.ok) {
                await this.dataEngine.createReport(reportPayload);
            }
            
            // Preserve TTL and hop_count for storage
            const savedMsg = { ...msg, ttl: Math.max(0, msg.ttl - 1), hop_count: msg.hop_count + 1 };
            await this.dataEngine.saveMessage(savedMsg);
            
            // Send ACK back only after durable persistence succeeds
            if (msg.origin_device_id) {
                const ackMsg: MessageDto = {
                  protocol_version: 1,
                  message_id: "ack_" + msg.message_id,
                  origin_device_id: (this.networkEngine as any).localNodeId || "unknown",
                  destination_device_id: msg.origin_device_id,
                  message_type: "ACK",
                  created_at: Date.now(),
                  ttl: 1,
                  hop_count: 0,
                  priority: "NORMAL",
                  payload_hash: "",
                  payload: { ack_to: msg.message_id },
                  signature: ""
                };
                this.networkEngine.send(ackMsg);
            }
          } catch (e) {
            console.error('Failed to save incoming mesh report', e);
          }
        }`;

code = code.replace(targetReport, replacementReport);
fs.writeFileSync(file, code);
