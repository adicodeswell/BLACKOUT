import { useState, useEffect, useCallback } from "react";
import type { ResourceService } from "../services/ResourceService";
import type { ResourceDto, ResourceFilter, ResourceType } from "../contracts/data/ResourceDto";
import type { BlackoutError } from "../contracts/common/BlackoutError";

export interface UseResourcesResult {
  resources: ResourceDto[];
  isLoading: boolean;
  error?: BlackoutError;
  refresh: () => Promise<void>;
  filterType?: ResourceType;
  setFilterType: (type?: ResourceType) => void;
}

export function useResources(
  resourceService: ResourceService,
  initialFilter?: ResourceFilter
): UseResourcesResult {
  const [resources, setResources] = useState<ResourceDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<BlackoutError | undefined>(undefined);
  const [filterType, setFilterType] = useState<ResourceType | undefined>(initialFilter?.type);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    const filter: ResourceFilter = {
      ...initialFilter,
      type: filterType,
    };

    const res = await resourceService.listResources(filter);
    if (res.ok) {
      setResources(res.data);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, [resourceService, initialFilter, filterType]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    const unsubscribe = resourceService.subscribeToResourceEvents((event) => {
      if (event.type === "RESOURCE_UPDATED") {
        fetchResources();
      }
    });
    return () => unsubscribe();
  }, [resourceService, fetchResources]);

  return {
    resources,
    isLoading,
    error,
    refresh: fetchResources,
    filterType,
    setFilterType,
  };
}
