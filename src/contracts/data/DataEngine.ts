import type { Result } from "../common/Result";
import type { MessageDto } from "../network/MessageDto";
import type {
  EmergencyReportDto,
  CreateReportRequest,
} from "./EmergencyReport";
import type {
  IncidentDto,
  IncidentFilter,
  UpdateIncidentRequest,
  ConfidenceStateDto,
} from "./IncidentDto";
import type {
  EvidenceDto,
  AddEvidenceRequest,
} from "./EvidenceDto";
import type {
  ResourceDto,
  ResourceFilter,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "./ResourceDto";
import type { DataEvent } from "./DataEvents";

export interface DataEngine {
  createReport(
    report: CreateReportRequest
  ): Promise<Result<EmergencyReportDto>>;

  saveMessage(message: MessageDto): Promise<Result<void>>;
  getAllMessages(): Promise<Result<MessageDto[]>>;
  getMessage(messageId: string): Promise<Result<MessageDto>>;
  getPendingOutbound(): Promise<Result<MessageDto[]>>;
  markDelivered(
    messageId: string,
    deliveredAt: number
  ): Promise<Result<void>>;

  getIncident(incidentId: string): Promise<Result<IncidentDto>>;
  listIncidents(
    filter?: IncidentFilter
  ): Promise<Result<IncidentDto[]>>;
  updateIncident(
    request: UpdateIncidentRequest
  ): Promise<Result<IncidentDto>>;

  addEvidence(
    evidence: AddEvidenceRequest
  ): Promise<Result<EvidenceDto>>;

  createResource(
    resource: CreateResourceRequest
  ): Promise<Result<ResourceDto>>;
  listResources(
    filter?: ResourceFilter
  ): Promise<Result<ResourceDto[]>>;
  updateResource(
    request: UpdateResourceRequest
  ): Promise<Result<ResourceDto>>;

  calculateConfidence(
    incidentId: string
  ): Promise<Result<ConfidenceStateDto>>;

  subscribe(listener: (event: DataEvent) => void): () => void;
}