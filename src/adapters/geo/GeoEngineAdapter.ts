import type { Result } from "../../contracts/common/Result";
import type { GeoEngine, LocationEvent } from "../../contracts/geo/GeoEngine";
import type { LocationDto } from "../../contracts/geo/LocationDto";
import type { HazardDto, AddHazardRequest } from "../../contracts/geo/HazardDto";
import type {
  RouteDto,
  RouteOptions,
  MapRegion,
  MapLoadResult,
  NearbyItemDto,
} from "../../contracts/geo/RouteDto";

export class GeoEngineAdapter implements GeoEngine {
  constructor(
    private readonly engine: GeoEngine
  ) {}

  getCurrentLocation(): Promise<Result<LocationDto>> {
    return this.engine.getCurrentLocation();
  }

  observeLocation(
    listener: (event: LocationEvent) => void
  ): () => void {
    return this.engine.observeLocation(listener);
  }

  loadOfflineMap(
    region: MapRegion
  ): Promise<Result<MapLoadResult>> {
    return this.engine.loadOfflineMap(region);
  }

  getHazards(
    region: MapRegion
  ): Promise<Result<HazardDto[]>> {
    return this.engine.getHazards(region);
  }

  addHazard(
    request: AddHazardRequest
  ): Promise<Result<HazardDto>> {
    return this.engine.addHazard(request);
  }

  calculateRoute(
    start: LocationDto,
    destination: LocationDto,
    options: RouteOptions
  ): Promise<Result<RouteDto>> {
    return this.engine.calculateRoute(start, destination, options);
  }

  calculateDistance(
    a: LocationDto,
    b: LocationDto
  ): Promise<Result<number>> {
    return this.engine.calculateDistance(a, b);
  }

  findNearby(
    type:
      | "INCIDENT"
      | "RESOURCE"
      | "HAZARD"
      | "SHELTER"
      | "HOSPITAL",
    location: LocationDto,
    radiusM: number
  ): Promise<Result<NearbyItemDto[]>> {
    return this.engine.findNearby(type, location, radiusM);
  }

  updatePeerLocation(peerId: string, location: LocationDto): Promise<Result<void>> {
    if (this.engine.updatePeerLocation) {
      return this.engine.updatePeerLocation(peerId, location);
    }
    return Promise.resolve({ ok: true, data: undefined });
  }

  getPeerLocation(peerId: string): Promise<Result<LocationDto | null>> {
    if (this.engine.getPeerLocation) {
      return this.engine.getPeerLocation(peerId);
    }
    return Promise.resolve({ ok: true, data: null });
  }

  filterCloserNeighbors(destinationPeerId: string, candidatePeerIds: string[]): Promise<Result<string[]>> {
    if (this.engine.filterCloserNeighbors) {
      return this.engine.filterCloserNeighbors(destinationPeerId, candidatePeerIds);
    }
    return Promise.resolve({ ok: true, data: candidatePeerIds });
  }
}