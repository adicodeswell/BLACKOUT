import type { GeoEngine, LocationEvent } from "../contracts/geo/GeoEngine";
import type { DataEngine } from "../contracts/data/DataEngine";
import type { Result } from "../contracts/common/Result";
import type { LocationDto } from "../contracts/geo/LocationDto";
import type { HazardDto } from "../contracts/geo/HazardDto";
import type { MapRegion, MapLoadResult } from "../contracts/geo/RouteDto";
import type { IncidentDto } from "../contracts/data/IncidentDto";
import type { ResourceDto } from "../contracts/data/ResourceDto";

export const DEFAULT_BAY_AREA_REGION: MapRegion = {
  min_latitude: 37.7000,
  min_longitude: -122.5200,
  max_latitude: 37.8300,
  max_longitude: -122.3500,
};

export class MapService {
  constructor(
    private readonly geoEngine: GeoEngine,
    private readonly dataEngine: DataEngine
  ) {}

  async getCurrentLocation(): Promise<Result<LocationDto>> {
    return this.geoEngine.getCurrentLocation();
  }

  observeLocation(listener: (event: LocationEvent) => void): () => void {
    return this.geoEngine.observeLocation(listener);
  }

  async loadOfflineMap(region: MapRegion = DEFAULT_BAY_AREA_REGION): Promise<Result<MapLoadResult>> {
    return this.geoEngine.loadOfflineMap(region);
  }

  async getHazards(region: MapRegion = DEFAULT_BAY_AREA_REGION): Promise<Result<HazardDto[]>> {
    return this.geoEngine.getHazards(region);
  }

  async getIncidents(): Promise<Result<IncidentDto[]>> {
    return this.dataEngine.listIncidents();
  }

  async getResources(): Promise<Result<ResourceDto[]>> {
    return this.dataEngine.listResources();
  }
}
