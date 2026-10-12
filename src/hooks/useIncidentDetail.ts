import { useState, useEffect, useCallback } from "react";
import type { IncidentService } from "../services/IncidentService";
import type { IncidentDto, ConfidenceStateDto, IncidentStatus } from "../contracts/data/IncidentDto";
import type { EvidenceDto, EvidenceType } from "../contracts/data/EvidenceDto";
import type { BlackoutError } from "../contracts/common/BlackoutError";

export interface UseIncidentDetailResult {
  incident?: IncidentDto;
  confidence?: ConfidenceStateDto;
  evidenceList: EvidenceDto[];
  isLoading: boolean;
  error?: BlackoutError;
  refresh: () => Promise<void>;
  updateStatus: (newStatus: IncidentStatus) => Promise<boolean>;
  addEvidenceItem: (type: EvidenceType, uri: string) => Promise<boolean>;
}

export function useIncidentDetail(
  incidentService: IncidentService,
  incidentId: string
): UseIncidentDetailResult {
  const [incident, setIncident] = useState<IncidentDto | undefined>(undefined);
  const [confidence, setConfidence] = useState<ConfidenceStateDto | undefined>(undefined);
  const [evidenceList, setEvidenceList] = useState<EvidenceDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<BlackoutError | undefined>(undefined);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    const incRes = await incidentService.getIncident(incidentId);
    if (!incRes.ok) {
      setError(incRes.error);
      setIsLoading(false);
      return;
    }

    setIncident(incRes.data);

    // Fetch confidence details concurrently
    const confRes = await incidentService.getConfidence(incidentId);
    if (confRes.ok) {
      setConfidence(confRes.data);
    }

    setIsLoading(false);
  }, [incidentService, incidentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const unsubscribe = incidentService.subscribeToDataEvents((event) => {
      if (
        (event.type === "INCIDENT_UPDATED" && event.incident.incident_id === incidentId) ||
        (event.type === "CONFIDENCE_UPDATED" && event.confidence.incident_id === incidentId)
      ) {
        fetchDetail();
      }
    });
    return () => unsubscribe();
  }, [incidentService, incidentId, fetchDetail]);

  const updateStatus = async (newStatus: IncidentStatus): Promise<boolean> => {
    if (!incident) return false;
    const res = await incidentService.updateIncident({
      incident_id: incident.incident_id,
      status: newStatus,
    });
    if (res.ok) {
      setIncident(res.data);
      return true;
    } else {
      setError(res.error);
      return false;
    }
  };

  const addEvidenceItem = async (type: EvidenceType, uri: string): Promise<boolean> => {
    if (!incident) return false;
    const res = await incidentService.addEvidence({
      incident_id: incident.incident_id,
      type,
      local_uri: uri,
      captured_at: Date.now(),
    });
    if (res.ok) {
      setEvidenceList((prev) => [...prev, res.data]);
      fetchDetail();
      return true;
    } else {
      setError(res.error);
      return false;
    }
  };

  return {
    incident,
    confidence,
    evidenceList,
    isLoading,
    error,
    refresh: fetchDetail,
    updateStatus,
    addEvidenceItem,
  };
}
