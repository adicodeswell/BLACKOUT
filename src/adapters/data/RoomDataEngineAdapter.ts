import { NativeModules } from 'react-native';
import type { DataEngine } from "../../contracts/data/DataEngine";
import type { Result } from "../../contracts/common/Result";
import type { BlackoutError } from "../../contracts/common/BlackoutError";
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

const { BlackoutDataModule } = NativeModules;

function mapError(error: any, fallbackMessage: string): BlackoutError {
  return {
    code: "STORAGE",
    message: error?.message || String(error) || fallbackMessage,
    retryable: true,
    module: "DATA",
  };
}

/**
 * RoomDataEngineAdapter - Connects TypeScript DataEngine contract to native Android Room database
 * via BlackoutDataModule.
 */
export class RoomDataEngineAdapter implements DataEngine {
  private listeners: Set<(event: DataEvent) => void> = new Set();

  private getNativeModule() {
    if (!BlackoutDataModule) {
      throw new Error("BlackoutDataModule NativeModule is not available on this platform");
    }
    return BlackoutDataModule;
  }

  async createReport(request: CreateReportRequest): Promise<Result<EmergencyReportDto>> {
    try {
      const nativeModule = this.getNativeModule();
      const reportPayload = {
        category: request.category,
        severity: request.severity,
        description: request.description,
        location: request.location,
        evidence_ids: request.evidence_ids || [],
        reporter_device_id: "self-node-01",
      };

      const resultJsonStr = await nativeModule.createReport(JSON.stringify(reportPayload));
      const report: EmergencyReportDto = JSON.parse(resultJsonStr);
      
      this.notifyListeners({ type: "INCIDENT_UPDATED", incident: {
        incident_id: report.report_id,
        category: report.category,
        title: `${report.category} Emergency`,
        summary: report.description,
        location: report.location,
        first_reported_at: report.created_at,
        last_updated_at: report.created_at,
        status: "OPEN",
        severity: report.severity,
        confidence_level: "UNVERIFIED",
        independent_source_count: 1,
        contradiction_count: 0,
        evidence_count: report.evidence_ids.length,
      }});

      return { ok: true, data: report };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to create report in Room DB") };
    }
  }

  async saveMessage(message: MessageDto): Promise<Result<void>> {
    try {
      const nativeModule = this.getNativeModule();
      await nativeModule.saveMessage(JSON.stringify(message));
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to save message") };
    }
  }

  async getMessage(messageId: string): Promise<Result<MessageDto>> {
    try {
      const nativeModule = this.getNativeModule();
      const jsonStr = await nativeModule.getMessage(messageId);
      if (!jsonStr) {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: `Message ${messageId} not found`, retryable: false, module: "DATA" },
        };
      }
      const msg: MessageDto = JSON.parse(jsonStr);
      return { ok: true, data: msg };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to fetch message") };
    }
  }

  async getPendingOutbound(): Promise<Result<MessageDto[]>> {
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
  }

  async getIncident(incidentId: string): Promise<Result<IncidentDto>> {
    try {
      const nativeModule = this.getNativeModule();
      const jsonStr = await nativeModule.getIncident(incidentId);
      if (!jsonStr) {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: `Incident ${incidentId} not found`, retryable: false, module: "DATA" },
        };
      }
      const incident: IncidentDto = JSON.parse(jsonStr);
      return { ok: true, data: incident };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to fetch incident") };
    }
  }

  async listIncidents(filter?: IncidentFilter): Promise<Result<IncidentDto[]>> {
    try {
      const nativeModule = this.getNativeModule();
      const jsonStr = await nativeModule.listIncidents();
      let incidents: IncidentDto[] = JSON.parse(jsonStr);

      if (filter?.category) {
        incidents = incidents.filter((i) => i.category === filter.category);
      }
      if (filter?.status) {
        incidents = incidents.filter((i) => i.status === filter.status);
      }

      return { ok: true, data: incidents };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to list incidents from Room DB") };
    }
  }

  async updateIncident(request: UpdateIncidentRequest): Promise<Result<IncidentDto>> {
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
  }

  async createResource(request: CreateResourceRequest): Promise<Result<ResourceDto>> {
    try {
      const nativeModule = this.getNativeModule();
      const resourcePayload = {
        type: request.type,
        name: request.name,
        description: request.description,
        location: request.location,
        availability: request.availability,
        capacity: request.capacity,
        remaining_capacity: request.remaining_capacity,
        expires_at: request.expires_at,
      };

      const resultJsonStr = await nativeModule.createResource(JSON.stringify(resourcePayload));
      const res: ResourceDto = JSON.parse(resultJsonStr);

      this.notifyListeners({ type: "RESOURCE_UPDATED", resource_id: res.resource_id });
      return { ok: true, data: res };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to create resource in Room DB") };
    }
  }

  async listResources(filter?: ResourceFilter): Promise<Result<ResourceDto[]>> {
    try {
      const nativeModule = this.getNativeModule();
      const jsonStr = await nativeModule.listResources();
      let resources: ResourceDto[] = JSON.parse(jsonStr);

      if (filter?.type) {
        resources = resources.filter((r) => r.type === filter.type);
      }
      if (filter?.availability) {
        resources = resources.filter((r) => r.availability === filter.availability);
      }

      return { ok: true, data: resources };
    } catch (error) {
      return { ok: false, error: mapError(error, "Failed to list resources from Room DB") };
    }
  }

  async updateResource(request: UpdateResourceRequest): Promise<Result<ResourceDto>> {
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
  }

  subscribe(listener: (event: DataEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: DataEvent) {
    this.listeners.forEach((l) => l(event));
  }
}
