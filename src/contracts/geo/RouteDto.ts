import type { LocationDto } from "./LocationDto";

export interface RouteOptions {
  avoid_hazards: boolean;
  avoid_blocked_roads: boolean;
  max_hazard_severity?: number;
}

export interface RouteDto {
  route_id: string;
  origin: LocationDto;
  destination: LocationDto;
  distance_m: number;
  duration_s: number;
  geometry: Array<{
    latitude: number;
    longitude: number;
  }>;
  avoided_hazard_ids: string[];
  calculated_at: number;
}

export interface MapRegion {
  min_latitude: number;
  min_longitude: number;
  max_latitude: number;
  max_longitude: number;
}

export interface MapLoadResult {
  region: MapRegion;
  available: boolean;
  source: "BUNDLED" | "LOCAL_CACHE";
  path?: string;
}

export interface NearbyItemDto {
  id: string;
  type: string;
  location: LocationDto;
  distance_m: number;
  title?: string;
}