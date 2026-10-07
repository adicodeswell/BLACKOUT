import type { DataEngine } from "../../contracts/data/DataEngine";
import type { Result } from "../../contracts/common/Result";
import type { MessageDto } from "../../contracts/network/MessageDto";
import type {
  EmergencyReportDto,
  CreateReportRequest,
} from "../../contracts/data/EmergencyReport";
import type {
  IncidentDto,
  IncidentFilter,
  UpdateIncidentRequest,
  ConfidenceStateDto,
} from "../../contracts/data/IncidentDto";
import type {
  EvidenceDto,
  AddEvidenceRequest,
} from "../../contracts/data/EvidenceDto";
import type {
  ResourceDto,
  ResourceFilter,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "../../contracts/data/ResourceDto";
import type { DataEvent } from "../../contracts/data/DataEvents";

export class DevDataEngine implements DataEngine {
  private reports: EmergencyReportDto[] = [];
  private incidents: Map<string, IncidentDto> = new Map();
  private evidenceMap: Map<string, EvidenceDto[]> = new Map();
  private resources: Map<string, ResourceDto> = new Map();
  private listeners: Set<(event: DataEvent) => void> = new Set();

  constructor() {
    this.seedMockData();
  }

  private seedMockData() {
    const now = Date.now();
    const inc1: IncidentDto = {
      incident_id: "inc-001",
      category: "FIRE",
      title: "Commercial Building Structure Fire",
      summary: "Heavy smoke and active flames reported on 3rd floor. Emergency teams notified.",
      location: { latitude: 37.7749, longitude: -122.4194, accuracy_m: 10, captured_at: now - 1000 * 60 * 45 },
      first_reported_at: now - 1000 * 60 * 45,
      last_updated_at: now - 1000 * 60 * 10,
      status: "OPEN",
      severity: "CRITICAL",
      confidence_level: "HIGH_CONFIDENCE",
      independent_source_count: 4,
      contradiction_count: 0,
      evidence_count: 2,
    };

    const inc2: IncidentDto = {
      incident_id: "inc-002",
      category: "BLOCKED_ROAD",
      title: "Main Street Landslide Blockage",
      summary: "Debris and fallen trees blocking both lanes near North Bridge.",
      location: { latitude: 37.7833, longitude: -122.4167, accuracy_m: 25, captured_at: now - 1000 * 60 * 120 },
      first_reported_at: now - 1000 * 60 * 120,
      last_updated_at: now - 1000 * 60 * 30,
      status: "MONITORING",
      severity: "HIGH",
      confidence_level: "LIKELY",
      independent_source_count: 2,
      contradiction_count: 1,
      evidence_count: 1,
    };

    const inc3: IncidentDto = {
      incident_id: "inc-003",
      category: "WATER",
      title: "Clean Water Distribution Point",
      summary: "Potable water supply station established at Central Square.",
      location: { latitude: 37.7695, longitude: -122.4467, accuracy_m: 5, captured_at: now - 1000 * 60 * 360 },
      first_reported_at: now - 1000 * 60 * 360,
      last_updated_at: now - 1000 * 60 * 60,
      status: "RESOLVED",
      severity: "LOW",
      confidence_level: "CONFIRMED",
      independent_source_count: 6,
      contradiction_count: 0,
      evidence_count: 3,
    };

    this.incidents.set(inc1.incident_id, inc1);
    this.incidents.set(inc2.incident_id, inc2);
    this.incidents.set(inc3.incident_id, inc3);

    const ev1: EvidenceDto = {
      evidence_id: "ev-101",
      incident_id: "inc-001",
      type: "IMAGE",
      local_uri: "file:///storage/emulated/0/BLACKOUT/ev1.jpg",
      content_hash: "a1b2c3d4e5f67890",
      captured_at: now - 1000 * 60 * 40,
      location: { latitude: 37.7749, longitude: -122.4194, accuracy_m: 10, captured_at: now - 1000 * 60 * 40 },
      source_device_id: "node-alpha-01",
      analysis_state: "COMPLETE",
    };

    const ev2: EvidenceDto = {
      evidence_id: "ev-102",
      incident_id: "inc-001",
      type: "TEXT",
      local_uri: "file:///storage/emulated/0/BLACKOUT/ev2.txt",
      content_hash: "f6e5d4c3b2a10987",
      captured_at: now - 1000 * 60 * 20,
      source_device_id: "node-bravo-02",
      analysis_state: "PENDING",
    };

    const ev3: EvidenceDto = {
      evidence_id: "ev-103",
      incident_id: "inc-002",
      type: "IMAGE",
      local_uri: "file:///storage/emulated/0/BLACKOUT/ev3.jpg",
      content_hash: "1234567890abcdef",
      captured_at: now - 1000 * 60 * 100,
      source_device_id: "node-charlie-03",
      analysis_state: "COMPLETE",
    };

    this.evidenceMap.set("inc-001", [ev1, ev2]);
    this.evidenceMap.set("inc-002", [ev3]);

    // Seed Resource Mock Data
    const res1: ResourceDto = {
      resource_id: "res-001",
      type: "WATER",
      name: "Community Water Station",
      description: "Clean drinking water distribution point. Bring reusable containers.",
      location: { latitude: 37.7749, longitude: -122.4194, accuracy_m: 5, captured_at: now - 1000 * 60 * 15 },
      availability: "AVAILABLE",
      capacity: 500,
      remaining_capacity: 350,
      source_device_id: "node-water-01",
      created_at: now - 1000 * 60 * 120,
      updated_at: now - 1000 * 60 * 15,
    };

    const res2: ResourceDto = {
      resource_id: "res-002",
      type: "SHELTER",
      name: "North Gym Emergency Shelter",
      description: "Overnight shelter with cots, blankets, and heating. Pets allowed in designated area.",
      location: { latitude: 37.7833, longitude: -122.4167, accuracy_m: 10, captured_at: now - 1000 * 60 * 30 },
      availability: "LIMITED",
      capacity: 200,
      remaining_capacity: 18,
      source_device_id: "node-shelter-02",
      created_at: now - 1000 * 60 * 240,
      updated_at: now - 1000 * 60 * 30,
    };

    const res3: ResourceDto = {
      resource_id: "res-003",
      type: "MEDICAL",
      name: "First Aid & Medical Triage",
      description: "Basic trauma treatment, bandages, burn care, and OTC pain relievers.",
      location: { latitude: 37.7695, longitude: -122.4467, accuracy_m: 5, captured_at: now - 1000 * 60 * 5 },
      availability: "AVAILABLE",
      capacity: 100,
      remaining_capacity: 85,
      source_device_id: "node-med-03",
      created_at: now - 1000 * 60 * 180,
      updated_at: now - 1000 * 60 * 5,
    };

    const res4: ResourceDto = {
      resource_id: "res-004",
      type: "FOOD",
      name: "Hot Meals Distribution",
      description: "Hot soup and dry ration kits provided by local volunteer network.",
      location: { latitude: 37.7710, longitude: -122.4250, accuracy_m: 8, captured_at: now - 1000 * 60 * 90 },
      availability: "CLOSED",
      capacity: 300,
      remaining_capacity: 0,
      source_device_id: "node-food-04",
      created_at: now - 1000 * 60 * 300,
      updated_at: now - 1000 * 60 * 90,
    };

    this.resources.set(res1.resource_id, res1);
    this.resources.set(res2.resource_id, res2);
    this.resources.set(res3.resource_id, res3);
    this.resources.set(res4.resource_id, res4);
  }

  async createReport(request: CreateReportRequest): Promise<Result<EmergencyReportDto>> {
    const report: EmergencyReportDto = {
      report_id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: request.category,
      severity: request.severity,
      description: request.description,
      location: request.location,
      created_at: Date.now(),
      reporter_device_id: "self-node-01",
      verification_state: "UNVERIFIED",
      evidence_ids: request.evidence_ids || [],
    };
    this.reports.push(report);
    return { ok: true, data: report };
  }

  async saveMessage(_message: MessageDto): Promise<Result<void>> {
    return { ok: true, data: undefined };
  }

  async getMessage(_messageId: string): Promise<Result<MessageDto>> {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Message not found", retryable: false, module: "DATA" },
    };
  }

  async getPendingOutbound(): Promise<Result<MessageDto[]>> {
    return { ok: true, data: [] };
  }

  async markDelivered(_messageId: string, _deliveredAt: number): Promise<Result<void>> {
    return { ok: true, data: undefined };
  }

  async getIncident(incidentId: string): Promise<Result<IncidentDto>> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `Incident ${incidentId} not found`, retryable: false, module: "DATA" },
      };
    }
    return { ok: true, data: incident };
  }

  async listIncidents(filter?: IncidentFilter): Promise<Result<IncidentDto[]>> {
    let result = Array.from(this.incidents.values());
    if (filter?.category) {
      result = result.filter((i) => i.category === filter.category);
    }
    if (filter?.status) {
      result = result.filter((i) => i.status === filter.status);
    }
    return { ok: true, data: result };
  }

  async updateIncident(request: UpdateIncidentRequest): Promise<Result<IncidentDto>> {
    const existing = this.incidents.get(request.incident_id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `Incident ${request.incident_id} not found`, retryable: false, module: "DATA" },
      };
    }

    const updated: IncidentDto = {
      ...existing,
      title: request.title ?? existing.title,
      summary: request.summary ?? existing.summary,
      status: request.status ?? existing.status,
      severity: request.severity ?? existing.severity,
      last_updated_at: Date.now(),
    };

    this.incidents.set(updated.incident_id, updated);
    this.notifyListeners({ type: "INCIDENT_UPDATED", incident: updated });
    return { ok: true, data: updated };
  }

  async addEvidence(request: AddEvidenceRequest): Promise<Result<EvidenceDto>> {
    const ev: EvidenceDto = {
      evidence_id: `ev-${Date.now()}`,
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

    const existing = this.evidenceMap.get(request.incident_id) || [];
    existing.push(ev);
    this.evidenceMap.set(request.incident_id, existing);

    // Update incident evidence count
    const inc = this.incidents.get(request.incident_id);
    if (inc) {
      const updatedInc = { ...inc, evidence_count: existing.length, last_updated_at: Date.now() };
      this.incidents.set(inc.incident_id, updatedInc);
      this.notifyListeners({ type: "INCIDENT_UPDATED", incident: updatedInc });
    }

    return { ok: true, data: ev };
  }

  async getEvidenceForIncident(incidentId: string): Promise<Result<EvidenceDto[]>> {
    const list = this.evidenceMap.get(incidentId) || [];
    return { ok: true, data: list };
  }

  async createResource(request: CreateResourceRequest): Promise<Result<ResourceDto>> {
    const now = Date.now();
    const resource: ResourceDto = {
      resource_id: `res-${now}-${Math.floor(Math.random() * 1000)}`,
      type: request.type,
      name: request.name,
      description: request.description,
      location: request.location,
      availability: request.availability,
      capacity: request.capacity,
      remaining_capacity: request.remaining_capacity,
      source_device_id: "self-node-01",
      created_at: now,
      updated_at: now,
      expires_at: request.expires_at,
    };

    this.resources.set(resource.resource_id, resource);
    this.notifyListeners({ type: "RESOURCE_UPDATED", resource_id: resource.resource_id });
    return { ok: true, data: resource };
  }

  async getResource(resourceId: string): Promise<Result<ResourceDto>> {
    const res = this.resources.get(resourceId);
    if (!res) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `Resource ${resourceId} not found`, retryable: false, module: "DATA" },
      };
    }
    return { ok: true, data: res };
  }

  async listResources(filter?: ResourceFilter): Promise<Result<ResourceDto[]>> {
    let result = Array.from(this.resources.values());
    if (filter?.type) {
      result = result.filter((r) => r.type === filter.type);
    }
    if (filter?.availability) {
      result = result.filter((r) => r.availability === filter.availability);
    }
    return { ok: true, data: result };
  }

  async updateResource(request: UpdateResourceRequest): Promise<Result<ResourceDto>> {
    const existing = this.resources.get(request.resource_id);
    if (!existing) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `Resource ${request.resource_id} not found`, retryable: false, module: "DATA" },
      };
    }

    const updated: ResourceDto = {
      ...existing,
      name: request.name ?? existing.name,
      description: request.description ?? existing.description,
      availability: request.availability ?? existing.availability,
      capacity: request.capacity ?? existing.capacity,
      remaining_capacity: request.remaining_capacity ?? existing.remaining_capacity,
      expires_at: request.expires_at ?? existing.expires_at,
      updated_at: Date.now(),
    };

    this.resources.set(updated.resource_id, updated);
    this.notifyListeners({ type: "RESOURCE_UPDATED", resource_id: updated.resource_id });
    return { ok: true, data: updated };
  }

  async calculateConfidence(incidentId: string): Promise<Result<ConfidenceStateDto>> {
    const inc = this.incidents.get(incidentId);
    if (!inc) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Incident not found", retryable: false, module: "DATA" },
      };
    }

    const state: ConfidenceStateDto = {
      incident_id: inc.incident_id,
      level: inc.confidence_level,
      independent_sources: inc.independent_source_count,
      supporting_evidence: inc.evidence_count,
      contradictions: inc.contradiction_count,
      freshness_factor: 0.95,
      rationale: `Aggregated from ${inc.independent_source_count} independent reports and ${inc.evidence_count} media items. ${inc.contradiction_count} contradictions flagged.`,
      calculated_at: Date.now(),
    };

    return { ok: true, data: state };
  }

  subscribe(listener: (event: DataEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: DataEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}
