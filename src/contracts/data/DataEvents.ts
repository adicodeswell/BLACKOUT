import type { IncidentDto } from "./IncidentDto";
import type { ConfidenceStateDto } from "./IncidentDto";

export type DataEvent =
  | {
      type: "REPORT_CREATED";
      report_id: string;
      incident_id?: string;
    }
  | {
      type: "INCIDENT_UPDATED";
      incident: IncidentDto;
    }
  | {
      type: "RESOURCE_UPDATED";
      resource_id: string;
    }
  | {
      type: "HAZARD_UPDATED";
      hazard_id: string;
    }
  | {
      type: "CONFIDENCE_UPDATED";
      confidence: ConfidenceStateDto;
    };