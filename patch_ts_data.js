const fs = require('fs');
const path = 'src/adapters/data/RoomDataEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  async getPendingOutbound(): Promise<Result<MessageDto[]>> {
    return { ok: true, data: [] };
  }

  async markDelivered(_messageId: string, _deliveredAt: number): Promise<Result<void>> {
    return { ok: true, data: undefined };
  }`;

const inject1 = `  async getPendingOutbound(): Promise<Result<MessageDto[]>> {
    try {
      const jsonStr = await this.getNativeModule().getPendingOutbound();
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to get pending outbound") };
    }
  }

  async markDelivered(messageId: string, deliveredAt: number): Promise<Result<void>> {
    try {
      await this.getNativeModule().markDelivered(messageId, deliveredAt);
      return { ok: true, data: undefined };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to mark delivered") };
    }
  }`;

code = code.replace(target1, inject1);

const target2 = `  async updateIncident(_request: UpdateIncidentRequest): Promise<Result<IncidentDto>> {
    return {
      ok: false,
      error: { code: "NOT_IMPLEMENTED", message: "Update incident native bridge not yet attached", retryable: false, module: "DATA" },
    };
  }

  async addEvidence(request: AddEvidenceRequest): Promise<Result<EvidenceDto>> {
    const ev: EvidenceDto = {
      evidence_id: \`ev-\${Date.now()}\`,
      incident_id: request.incident_id,
      report_id: request.report_id,
      type: request.type,
      local_uri: request.local_uri,
      content_hash: request.content_hash,
      captured_at: request.captured_at || Date.now(),
      location: request.location,
      source_device_id: "self-node-01",
      analysis_state: "PENDING",
    };
    return { ok: true, data: ev };
  }

  async getEvidenceForIncident(_incidentId: string): Promise<Result<EvidenceDto[]>> {
    return { ok: true, data: [] };
  }`;

const inject2 = `  async updateIncident(request: UpdateIncidentRequest): Promise<Result<IncidentDto>> {
    try {
      const jsonStr = await this.getNativeModule().updateIncident(JSON.stringify(request));
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to update incident") };
    }
  }

  async addEvidence(request: AddEvidenceRequest): Promise<Result<EvidenceDto>> {
    try {
      const jsonStr = await this.getNativeModule().addEvidence(JSON.stringify(request));
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to add evidence") };
    }
  }

  async getEvidenceForIncident(incidentId: string): Promise<Result<EvidenceDto[]>> {
    try {
      const jsonStr = await this.getNativeModule().getEvidenceForIncident(incidentId);
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to get evidence") };
    }
  }`;

code = code.replace(target2, inject2);

const target3 = `  async updateResource(request: UpdateResourceRequest): Promise<Result<ResourceDto>> {
    const resRes = await this.listResources();
    if (!resRes.ok) return { ok: false, error: resRes.error };
    const existing = resRes.data.find((r) => r.resource_id === request.resource_id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: \`Resource \${request.resource_id} not found\`, retryable: false, module: "DATA" },
      };
    }
    return { ok: true, data: existing };
  }

  async calculateConfidence(incidentId: string): Promise<Result<ConfidenceStateDto>> {
    const state: ConfidenceStateDto = {
      incident_id: incidentId,
      level: "HIGH_CONFIDENCE",
      independent_sources: 2,
      supporting_evidence: 1,
      contradictions: 0,
      freshness_factor: 0.98,
      rationale: "Processed via native Room DBConfidenceCalculator engine.",
      calculated_at: Date.now(),
    };
    return { ok: true, data: state };
  }`;

const inject3 = `  async updateResource(request: UpdateResourceRequest): Promise<Result<ResourceDto>> {
    try {
      const jsonStr = await this.getNativeModule().updateResource(JSON.stringify(request));
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to update resource") };
    }
  }

  async calculateConfidence(incidentId: string): Promise<Result<ConfidenceStateDto>> {
    try {
      const jsonStr = await this.getNativeModule().calculateConfidence(incidentId);
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: mapError(e, "Failed to calculate confidence") };
    }
  }`;

code = code.replace(target3, inject3);
fs.writeFileSync(path, code);
