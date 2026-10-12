import { useState, useEffect, useCallback } from "react";
import type { PeopleService } from "../services/PeopleService";
import type { PeerDto } from "../contracts/network/PeerDto";
import type { BlackoutError } from "../contracts/common/BlackoutError";

export interface UsePeersResult {
  peers: PeerDto[];
  isLoading: boolean;
  error?: BlackoutError;
  refresh: () => Promise<void>;
}

export function usePeers(peopleService: PeopleService): UsePeersResult {
  const [peers, setPeers] = useState<PeerDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<BlackoutError | undefined>(undefined);

  const fetchPeers = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    const res = await peopleService.getPeers();
    if (res.ok) {
      setPeers(res.data);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, [peopleService]);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

  useEffect(() => {
    const unsubscribe = peopleService.subscribePeers((updatedPeers) => {
      setPeers(updatedPeers);
    });
    return () => unsubscribe();
  }, [peopleService]);

  return {
    peers,
    isLoading,
    error,
    refresh: fetchPeers,
  };
}
