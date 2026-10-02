import { LocationDto } from '../geo/LocationDto';

export interface EmergencyReportDto {
  report_id: string;
  reporter_device_id: string;
  category: string;
  description: string;
  created_at: number;
  severity: string;
  verification_state: string;
  evidence_ids: string[];
  location?: LocationDto;
}
