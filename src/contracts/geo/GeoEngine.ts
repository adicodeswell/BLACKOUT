import type { Result } from "../common/Result";
import type { LocationDto } from "./LocationDto";
import type {
  HazardDto,
  AddHazardRequest,
} from "./HazardDto";
import type {
  RouteDto,
  RouteOptions,
  MapRegion,
  MapLoadResult,
  NearbyItemDto,
} from "./RouteDto";

export type LocationEvent = {
  type: "LOCATION_UPDATED";
  location: LocationDto;
};

export interface GeoEngine {
  getCurrentLocation(): Promise<Result<LocationDto>>;

  observeLocation(
    listener: (event: LocationEvent) => void
  ): () => void;

  loadOfflineMap(
    region: MapRegion
  ): Promise<Result<MapLoadResult>>;

  getHazards(
    region: MapRegion
  ): Promise<Result<HazardDto[]>>;

  addHazard(
    hazard: AddHazardRequest
  ): Promise<Result<HazardDto>>;

  calculateRoute(
    start: LocationDto,
    destination: LocationDto,
    options: RouteOptions
  ): Promise<Result<RouteDto>>;

  calculateDistance(
    a: LocationDto,
    b: LocationDto
  ): Promise<Result<number>>;

  findNearby(
    type:
      | "INCIDENT"
      | "RESOURCE"
      | "HAZARD"
      | "SHELTER"
      | "HOSPITAL",
    location: LocationDto,
    radiusM: number
  ): Promise<Result<NearbyItemDto[]>>;
}