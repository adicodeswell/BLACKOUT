import { useState, useEffect, useCallback } from "react";
import type { IncidentService } from "../services/IncidentService";
import type { IncidentDto, IncidentFilter } from "../contracts/data/IncidentDto";
import type { BlackoutError } from "../contracts/common/BlackoutError";

export interface UseIncidentsResult {
  incidents: IncidentDto[];
  isLoading: boolean;
  error?: BlackoutError;
  refresh: () => Promise<void>;
  filterCategory?: string;
  setFilterCategory: (cat?: string) => void;
}

export function useIncidents(
  incidentService: IncidentService,
  initialFilter?: IncidentFilter
): UseIncidentsResult {
  const [incidents, setIncidents] = useState<IncidentDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<BlackoutError | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(initialFilter?.category);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    const filter: IncidentFilter = {
      ...initialFilter,
      category: filterCategory,
    };

    const res = await incidentService.listIncidents(filter);
    if (res.ok) {
      setIncidents(res.data);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, [incidentService, initialFilter, filterCategory]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Subscribe to real-time incident events from DataEngine
  useEffect(() => {
    const unsubscribe = incidentService.subscribeToDataEvents((event) => {
      if (event.type === "INCIDENT_UPDATED" || event.type === "REPORT_CREATED") {
        fetchIncidents();
      }
    });
    return () => unsubscribe();
  }, [incidentService, fetchIncidents]);

  return {
    incidents,
    isLoading,
    error,
    refresh: fetchIncidents,
    filterCategory,
    setFilterCategory,
  };
}
