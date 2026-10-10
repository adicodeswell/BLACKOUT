const fs = require('fs');
const file = 'tests/integration/MeshIntegration.test.ts';
let content = fs.readFileSync(file, 'utf8');

const getIncidentMethod = `  async createReport(request: any): Promise<Result<EmergencyReportDto>> {`;

const newGetIncidentMethod = `  async getIncident(reportId: string): Promise<Result<EmergencyReportDto>> {
    const report = this.createdReports.find(r => r.report_id === reportId);
    if (report) return { ok: true, data: report };
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, module: 'DATA' } as any };
  }

  async createReport(request: any): Promise<Result<EmergencyReportDto>> {`;

content = content.replace(getIncidentMethod, newGetIncidentMethod);
fs.writeFileSync(file, content, 'utf8');
