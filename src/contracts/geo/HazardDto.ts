import type { Severity } from "../data/EmergencyReport";

export interface HazardDto {
  hazard_id: string;
  type: string;
  geometry: unknown;
  severity: Severity; 
  source_incident_id?: string;
  status: "ACTIVE" | "RESOLVED" | "EXPIRED";
  created_at: number;
  updated_at: number;
  expires_at?: number;
}

export interface AddHazardRequest {
  type: string;
  geometry: unknown;
  severity: Severity;
  source_incident_id?: string;
  expires_at?: number;
}