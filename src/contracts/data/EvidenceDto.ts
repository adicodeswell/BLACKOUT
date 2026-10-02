import type { LocationDto } from "../geo/LocationDto";

export type EvidenceType =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "TEXT";

export type EvidenceAnalysisState =
  | "PENDING"
  | "COMPLETE"
  | "FAILED";

export interface EvidenceDto {
  evidence_id: string;
  incident_id: string;
  report_id?: string;
  type: EvidenceType;
  local_uri?: string;
  content_hash?: string;
  captured_at?: number;
  location?: LocationDto;
  source_device_id: string;
  analysis_state: EvidenceAnalysisState;
}

export interface AddEvidenceRequest {
  incident_id: string;
  report_id?: string;
  type: EvidenceType;
  local_uri?: string;
  content_hash?: string;
  captured_at?: number;
  location?: LocationDto;
}