import type { GeoEngine, LocationEvent } from "../../contracts/geo/GeoEngine";
import type { Result } from "../../contracts/common/Result";
import type { LocationDto } from "../../contracts/geo/LocationDto";
import type { HazardDto, AddHazardRequest } from "../../contracts/geo/HazardDto";
import type {
  RouteDto,
  RouteOptions,
  MapRegion,
  MapLoadResult,
  NearbyItemDto,
} from "../../contracts/geo/RouteDto";

/**
 * DevGeoEngine - Development fallback implementation for GeoEngine contract.
 * Used exclusively for Member 4 UI development and testing when native bridge is unattached.
 */
export class DevGeoEngine implements GeoEngine {
  private currentLocation: LocationDto = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy_m: 8,
    captured_at: Date.now(),
  };

  private listeners: Set<(event: LocationEvent) => void> = new Set();
  private hazards: Map<string, HazardDto> = new Map();

  constructor() {
    this.seedMockHazards();
  }

  private seedMockHazards() {
    const now = Date.now();
    const h1: HazardDto = {
      hazard_id: "haz-001",
      type: "FLOOD",
      severity: "CRITICAL",
      status: "ACTIVE",
      geometry: { latitude: 37.7780, longitude: -122.4120 },
      source_incident_id: "inc-001",
      created_at: now - 1000 * 60 * 60,
      updated_at: now - 1000 * 60 * 15,
    };

    const h2: HazardDto = {
      hazard_id: "haz-002",
      type: "ROAD_BLOCK",
      severity: "HIGH",
      status: "ACTIVE",
      geometry: { latitude: 37.7850, longitude: -122.4170 },
      source_incident_id: "inc-002",
      created_at: now - 1000 * 60 * 120,
      updated_at: now - 1000 * 60 * 30,
    };

    const h3: HazardDto = {
      hazard_id: "haz-003",
      type: "HAZMAT",
      severity: "MEDIUM",
      status: "ACTIVE",
      geometry: { latitude: 37.7680, longitude: -122.4380 },
      created_at: now - 1000 * 60 * 180,
      updated_at: now - 1000 * 60 * 45,
    };

    this.hazards.set(h1.hazard_id, h1);
    this.hazards.set(h2.hazard_id, h2);
    this.hazards.set(h3.hazard_id, h3);
  }

  async getCurrentLocation(): Promise<Result<LocationDto>> {
    this.currentLocation.captured_at = Date.now();
    return { ok: true, data: { ...this.currentLocation } };
  }

  observeLocation(listener: (event: LocationEvent) => void): () => void {
    this.listeners.add(listener);
    // Send immediate initial position
    listener({ type: "LOCATION_UPDATED", location: { ...this.currentLocation } });
    return () => {
      this.listeners.delete(listener);
    };
  }

  async loadOfflineMap(region: MapRegion): Promise<Result<MapLoadResult>> {
    return {
      ok: true,
      data: {
        region,
        available: true,
        source: "LOCAL_CACHE",
      },
    };
  }

  async getHazards(_region: MapRegion): Promise<Result<HazardDto[]>> {
    return { ok: true, data: Array.from(this.hazards.values()) };
  }

  async addHazard(request: AddHazardRequest): Promise<Result<HazardDto>> {
    const now = Date.now();
    const hazard: HazardDto = {
      hazard_id: `haz-${now}-${Math.floor(Math.random() * 1000)}`,
      type: request.type,
      geometry: request.geometry,
      severity: request.severity,
      source_incident_id: request.source_incident_id,
      status: "ACTIVE",
      created_at: now,
      updated_at: now,
      expires_at: request.expires_at,
    };

    this.hazards.set(hazard.hazard_id, hazard);
    return { ok: true, data: hazard };
  }

  async calculateRoute(
    _start: LocationDto,
    _destination: LocationDto,
    _options: RouteOptions
  ): Promise<Result<RouteDto>> {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED",
        message: "Route calculation belongs to Phase 7.",
        retryable: false,
        module: "GEO",
      },
    };
  }

  async calculateDistance(a: LocationDto, b: LocationDto): Promise<Result<number>> {
    // Standard Haversine distance in meters
    const R = 6371e3;
    const phi1 = (a.latitude * Math.PI) / 180;
    const phi2 = (b.latitude * Math.PI) / 180;
    const deltaPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
    const deltaLambda = ((b.longitude - a.longitude) * Math.PI) / 180;

    const x =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    const d = R * c;

    return { ok: true, data: Math.round(d) };
  }

  async findNearby(
    type: "INCIDENT" | "RESOURCE" | "HAZARD" | "SHELTER" | "HOSPITAL",
    _location: LocationDto,
    _radiusM: number
  ): Promise<Result<NearbyItemDto[]>> {
    if (type === "HAZARD") {
      const nearby: NearbyItemDto[] = Array.from(this.hazards.values()).map((h) => {
        const geom = h.geometry as { latitude: number; longitude: number };
        return {
          id: h.hazard_id,
          type: h.type,
          location: {
            latitude: geom?.latitude ?? 37.7749,
            longitude: geom?.longitude ?? -122.4194,
            accuracy_m: 10,
            captured_at: h.updated_at,
          },
          distance_m: 250,
          title: `Hazard: ${h.type}`,
        };
      });
      return { ok: true, data: nearby };
    }

    return { ok: true, data: [] };
  }
}
