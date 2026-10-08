import type { DataEngine } from "../contracts/data/DataEngine";
import type { GeoEngine } from "../contracts/geo/GeoEngine";
import type { NetworkEngine } from "../contracts/network/NetworkEngine";
import type {
  CreateReportRequest,
  EmergencyReportDto,
  Severity,
} from "../contracts/data/EmergencyReport";
import type { LocationDto } from "../contracts/geo/LocationDto";
import type { MessageDto, DeliveryHandle, MessagePriority } from "../contracts/network/MessageDto";
import type { Result } from "../contracts/common/Result";
import type { BlackoutError } from "../contracts/common/BlackoutError";

export interface CreateEmergencyReportSubmission {
  request: CreateReportRequest;
  attachLocation?: boolean;
}

export interface EmergencyReportSubmissionResult {
  localReport: EmergencyReportDto;
  location?: LocationDto;
  locationError?: BlackoutError;
  deliveryHandle?: DeliveryHandle;
  broadcastAttempted: boolean;
  networkError?: BlackoutError;
}

function mapSeverityToPriority(severity: Severity): MessagePriority {
  switch (severity) {
    case "CRITICAL":
      return "CRITICAL_EMERGENCY";
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "NORMAL";
    case "LOW":
    case "UNKNOWN":
    default:
      return "LOW";
  }
}

export class EmergencyReportService {
  constructor(
    private readonly dataEngine: DataEngine,
    private readonly geoEngine: GeoEngine,
    private readonly networkEngine: NetworkEngine
  ) {
    // Listen for incoming Emergency Reports and save them to the local database
    this.networkEngine.subscribe(async (event) => {
      if (event.type === 'MESSAGE_RECEIVED') {
        const msg = event.message;
        if (msg.message_type === 'REPORT' && msg.payload) {
          try {
            // Save incoming mesh reports into our local SQLite
            await this.dataEngine.createReport(msg.payload as any);
          } catch (e) {
            console.error('Failed to save incoming mesh report', e);
          }
        }
      }
    });
  }

  /**
   * Orchestrates the local-first emergency report creation and optional P2P broadcast.
   */
  async submitReport(
    submission: CreateEmergencyReportSubmission
  ): Promise<Result<EmergencyReportSubmissionResult>> {
    let capturedLocation: LocationDto | undefined = submission.request.location;
    let locationError: BlackoutError | undefined = undefined;

    // 1. Optional GPS location acquisition
    if (submission.attachLocation && !capturedLocation) {
      const locationResult = await this.geoEngine.getCurrentLocation();
      if (locationResult.ok) {
        capturedLocation = locationResult.data;
      } else {
        locationError = locationResult.error;
      }
      // Note: Location acquisition failure does not block report creation.
    }

    // Prepare report request with resolved location
    const finalReportRequest: CreateReportRequest = {
      ...submission.request,
      location: capturedLocation ?? submission.request.location,
    };

    // 2. Local persistence in DataEngine (Primary local-first step)
    const reportResult = await this.dataEngine.createReport(finalReportRequest);

    if (!reportResult.ok) {
      // Local creation failed; return failure immediately
      return reportResult;
    }

    const localReport = reportResult.data;
    let deliveryHandle: DeliveryHandle | undefined = undefined;
    let broadcastAttempted = false;
    let networkError: BlackoutError | undefined = undefined;

    // 3. Network Broadcast (Secondary step — only after local report is persisted)
    try {
      const messageEnvelope: MessageDto = {
        protocol_version: 1,
        message_id: localReport.report_id,
        origin_device_id: localReport.reporter_device_id,
        message_type: "REPORT",
        created_at: localReport.created_at,
        ttl: 8, // Standard initial TTL for emergency report broadcasts
        hop_count: 0,
        priority: mapSeverityToPriority(localReport.severity),
        payload_hash: "", // Payload hash calculation performed by message serializer/signer
        payload: localReport,
        signature: "",
      };

      broadcastAttempted = true;
      const broadcastResult = await this.networkEngine.broadcast(messageEnvelope);

      if (broadcastResult.ok) {
        deliveryHandle = broadcastResult.data;
      } else {
        networkError = broadcastResult.error;
      }
    } catch (err) {
      networkError = {
        code: "TRANSPORT",
        message: err instanceof Error ? err.message : String(err),
        retryable: true,
        module: "NETWORK",
      };
    }

    // 4. Return success result with localReport (Network failure never invalidates local report)
    return {
      ok: true,
      data: {
        localReport,
        location: capturedLocation,
        locationError,
        deliveryHandle,
        broadcastAttempted,
        networkError,
      },
    };
  }
}
