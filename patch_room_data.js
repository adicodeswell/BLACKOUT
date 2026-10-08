const fs = require('fs');
const path = 'src/adapters/data/RoomDataEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const oldReportPayload = `      const reportPayload = {
        category: request.category,
        severity: request.severity,
        description: request.description,
        location: request.location,
        evidence_ids: request.evidence_ids || [],
        reporter_device_id: "self-node-01",
      };`;

const newReportPayload = `      const reportPayload = {
        category: request.category,
        severity: request.severity,
        description: request.description,
        location: request.location,
        evidence_ids: request.evidence_ids || [],
        reporter_device_id: (request as any).reporter_device_id || "self-node-01",
        report_id: (request as any).report_id,
        created_at: (request as any).created_at,
      };`;

code = code.replace(oldReportPayload, newReportPayload);
fs.writeFileSync(path, code);
