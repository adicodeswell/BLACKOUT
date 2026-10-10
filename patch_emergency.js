const fs = require('fs');
const file = 'src/services/EmergencyReportService.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `    // Prepare report request with resolved location
    const finalReportRequest: CreateReportRequest = {
      ...submission.request,
      location: capturedLocation ?? submission.request.location,
    };`,
  `    // Prepare report request with resolved location
    const finalReportRequest: CreateReportRequest = {
      ...submission.request,
      location: capturedLocation ?? submission.request.location,
      reporter_device_id: (this.networkEngine as any).localNodeId || "unknown-node",
      created_at: Date.now()
    } as any;`
);
fs.writeFileSync(file, content);
