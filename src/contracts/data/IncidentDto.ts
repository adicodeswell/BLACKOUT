import type { LocationDto } from "../geo/LocationDto";
import type { Severity, VerificationLevel } from "./EmergencyReport";

export type IncidentStatus =
  | "OPEN"
  | "MONITORING"
  | "RESOLVED"
  | "EXPIRED";

export interface IncidentDto {
  incident_id: string;
  category: string;
  title: string;
  summary: string;
  location?: LocationDto;
  first_reported_at: number;
  last_updated_at: number;
  status: IncidentStatus;
  severity: Severity;
  confidence_level: VerificationLevel;
  independent_source_count: number;
  contradiction_count: number;
  evidence_count: number;
}

export interface IncidentFilter {
  category?: string;
  status?: IncidentStatus;
  min_confidence?: VerificationLevel;
  center?: LocationDto;
  radius_m?: number;
}

export interface UpdateIncidentRequest {
  incident_id: string;
  title?: string;
  summary?: string;
  status?: IncidentStatus;
  severity?: Severity;
}

export interface ConfidenceStateDto {
  incident_id: string;
  level: VerificationLevel;
  independent_sources: number;
  supporting_evidence: number;
  contradictions: number;
  freshness_factor: number;
  rationale: string;
  calculated_at: number;
}