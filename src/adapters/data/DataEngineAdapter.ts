import type { Result } from "../../contracts/common/Result";
import type { MessageDto } from "../../contracts/network/MessageDto";
import type { DataEngine } from "../../contracts/data/DataEngine";
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
import type { ContactDto } from "../../contracts/data/ContactDto";
import type { DataEvent } from "../../contracts/data/DataEvents";

export class DataEngineAdapter implements DataEngine {
  constructor(
    private readonly engine: DataEngine
  ) {}

  saveContact(contact: ContactDto): Promise<Result<void>> {
    return this.engine.saveContact(contact);
  }

  getContact(peerId: string): Promise<Result<ContactDto>> {
    return this.engine.getContact(peerId);
  }

  getAllContacts(): Promise<Result<ContactDto[]>> {
    return this.engine.getAllContacts();
  }

  searchContacts(query: string): Promise<Result<ContactDto[]>> {
    if (this.engine.searchContacts) {
      return this.engine.searchContacts(query);
    }
    return Promise.resolve({ ok: true, data: [] });
  }

  createReport(
    request: CreateReportRequest
  ): Promise<Result<EmergencyReportDto>> {
    return this.engine.createReport(request);
  }

  getAllMessages(): Promise<Result<MessageDto[]>> {
    return this.engine.getAllMessages();
  }

  saveMessage(message: MessageDto): Promise<Result<void>> {
    return this.engine.saveMessage(message);
  }

  getMessage(messageId: string): Promise<Result<MessageDto>> {
    return this.engine.getMessage(messageId);
  }

  getPendingOutbound(): Promise<Result<MessageDto[]>> {
    return this.engine.getPendingOutbound();
  }

  updateDeliveryState(
    messageId: string,
    state: string
  ): Promise<Result<void>> {
    return this.engine.updateDeliveryState(messageId, state);
  }

  markDelivered(
    messageId: string,
    deliveredAt: number
  ): Promise<Result<void>> {
    return this.engine.markDelivered(messageId, deliveredAt);
  }

  getIncident(
    incidentId: string
  ): Promise<Result<IncidentDto>> {
    return this.engine.getIncident(incidentId);
  }

  listIncidents(
    filter?: IncidentFilter
  ): Promise<Result<IncidentDto[]>> {
    return this.engine.listIncidents(filter);
  }

  updateIncident(
    request: UpdateIncidentRequest
  ): Promise<Result<IncidentDto>> {
    return this.engine.updateIncident(request);
  }

  addEvidence(
    request: AddEvidenceRequest
  ): Promise<Result<EvidenceDto>> {
    return this.engine.addEvidence(request);
  }

  createResource(
    request: CreateResourceRequest
  ): Promise<Result<ResourceDto>> {
    return this.engine.createResource(request);
  }

  listResources(
    filter?: ResourceFilter
  ): Promise<Result<ResourceDto[]>> {
    return this.engine.listResources(filter);
  }

  updateResource(
    request: UpdateResourceRequest
  ): Promise<Result<ResourceDto>> {
    return this.engine.updateResource(request);
  }

  calculateConfidence(
    incidentId: string
  ): Promise<Result<ConfidenceStateDto>> {
    return this.engine.calculateConfidence(incidentId);
  }

  subscribe(
    listener: (event: DataEvent) => void
  ): () => void {
    return this.engine.subscribe(listener);
  }
}