import type { LocationDto } from "../geo/LocationDto";

export type ReportCategory =
  | "FIRE"
  | "FLOOD"
  | "MEDICAL"
  | "BUILDING_COLLAPSE"
  | "TRAPPED_PERSON"
  | "BLOCKED_ROAD"
  | "FOOD"
  | "WATER"
  | "SHELTER"
  | "OTHER";

export type Severity =
  | "UNKNOWN"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type VerificationLevel =
  | "UNVERIFIED"
  | "LIKELY"
  | "HIGH_CONFIDENCE"
  | "CONFIRMED";

export interface EmergencyReportDto {
  report_id: string;
  incident_id?: string;
  reporter_device_id: string;
  category: ReportCategory;
  description: string;
  location?: LocationDto;
  observed_at?: number;
  created_at: number;
  severity: Severity;
  verification_state: VerificationLevel;
  evidence_ids: string[];
}

export interface CreateReportRequest {
  category: ReportCategory;
  description: string;
  location?: LocationDto;
  observed_at?: number;
  severity: Severity;
  source_type?: "USER" | "SENSOR" | "AI_ASSISTED";
  evidence_ids?: string[];
}