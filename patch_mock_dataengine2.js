const fs = require('fs');
const file = 'tests/integration/MeshIntegration.test.ts';
let content = fs.readFileSync(file, 'utf8');

const oldIncident = `  async getIncident(reportId: string): Promise<Result<EmergencyReportDto>> {
    const report = this.createdReports.find(r => r.report_id === reportId);
    if (report) return { ok: true, data: report };
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, module: 'DATA' } as any };
  }`;

const newIncident = `  async getIncident(reportId: string): Promise<Result<any>> {
    const report = this.createdReports.find(r => r.report_id === reportId);
    if (report) {
       const inc = {
           incident_id: report.report_id,
           category: report.category,
           title: 'Mock Incident',
           summary: report.description,
           first_reported_at: report.created_at,
           last_updated_at: report.created_at,
           severity: report.severity,
           status: 'ACTIVE',
           confidence_score: 1.0,
           linked_report_ids: [report.report_id]
       };
       return { ok: true, data: inc };
    }
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, module: 'DATA' } as any };
  }`;

content = content.replace(oldIncident, newIncident);
fs.writeFileSync(file, content, 'utf8');
