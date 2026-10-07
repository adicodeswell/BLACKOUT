import type { DataEngine } from "../contracts/data/DataEngine";
import type { Result } from "../contracts/common/Result";
import type { BlackoutError } from "../contracts/common/BlackoutError";
import type {
  IncidentDto,
  IncidentFilter,
  UpdateIncidentRequest,
  ConfidenceStateDto,
} from "../contracts/data/IncidentDto";
import type {
  EvidenceDto,
  AddEvidenceRequest,
} from "../contracts/data/EvidenceDto";
import type { DataEvent } from "../contracts/data/DataEvents";

export class IncidentService {
  constructor(private readonly dataEngine: DataEngine) {}

  async listIncidents(filter?: IncidentFilter): Promise<Result<IncidentDto[]>> {
    try {
      return await this.dataEngine.listIncidents(filter);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  async getIncident(incidentId: string): Promise<Result<IncidentDto>> {
    try {
      return await this.dataEngine.getIncident(incidentId);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: err instanceof Error ? err.message : String(err),
          retryable: false,
          module: "DATA",
        },
      };
    }
  }

  async updateIncident(request: UpdateIncidentRequest): Promise<Result<IncidentDto>> {
    try {
      return await this.dataEngine.updateIncident(request);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  async getConfidence(incidentId: string): Promise<Result<ConfidenceStateDto>> {
    try {
      return await this.dataEngine.calculateConfidence(incidentId);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  async addEvidence(request: AddEvidenceRequest): Promise<Result<EvidenceDto>> {
    try {
      return await this.dataEngine.addEvidence(request);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  subscribeToDataEvents(listener: (event: DataEvent) => void): () => void {
    return this.dataEngine.subscribe(listener);
  }
}
