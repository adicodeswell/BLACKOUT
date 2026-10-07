import { useState, useEffect, useCallback } from "react";
import type { ResourceService } from "../services/ResourceService";
import type { ResourceDto, ResourceAvailability } from "../contracts/data/ResourceDto";
import type { BlackoutError } from "../contracts/common/BlackoutError";

export interface UseResourceDetailResult {
  resource?: ResourceDto;
  isLoading: boolean;
  error?: BlackoutError;
  refresh: () => Promise<void>;
  updateAvailability: (availability: ResourceAvailability) => Promise<boolean>;
}

export function useResourceDetail(
  resourceService: ResourceService,
  resourceId: string
): UseResourceDetailResult {
  const [resource, setResource] = useState<ResourceDto | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<BlackoutError | undefined>(undefined);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    const res = await resourceService.getResource(resourceId);
    if (res.ok) {
      setResource(res.data);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, [resourceService, resourceId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const unsubscribe = resourceService.subscribeToResourceEvents((event) => {
      if (event.type === "RESOURCE_UPDATED" && event.resource_id === resourceId) {
        fetchDetail();
      }
    });
    return () => unsubscribe();
  }, [resourceService, resourceId, fetchDetail]);

  const updateAvailability = async (availability: ResourceAvailability): Promise<boolean> => {
    if (!resource) return false;
    const res = await resourceService.updateResource({
      resource_id: resource.resource_id,
      availability,
    });
    if (res.ok) {
      setResource(res.data);
      return true;
    } else {
      setError(res.error);
      return false;
    }
  };

  return {
    resource,
    isLoading,
    error,
    refresh: fetchDetail,
    updateAvailability,
  };
}
