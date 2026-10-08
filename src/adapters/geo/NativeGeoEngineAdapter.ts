import { NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';
import type { GeoEngine } from '../../contracts/geo/GeoEngine';
import type { LocationDto } from '../../contracts/geo/LocationDto';
import type { RouteDto, RouteOptions } from '../../contracts/geo/RouteDto';
import type { HazardDto } from '../../contracts/geo/HazardDto';
import type { Result } from '../../contracts/common/Result';

const { BlackoutGeoModule } = NativeModules;
const geoEmitter = BlackoutGeoModule ? new NativeEventEmitter(BlackoutGeoModule) : null;

export class NativeGeoEngineAdapter implements GeoEngine {
  private async requestPermissions() {
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    } catch (e) {
      console.warn('Failed to request location permission', e);
    }
  }

  
  async initialize(): Promise<Result<void>> {
    await this.requestPermissions();

    try {
      await BlackoutGeoModule.initialize();
      return { ok: true, data: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: { code: 'UNAVAILABLE', message: error.message, retryable: true, module: 'GEO' }
      };
    }
  }

  
  async startTracking(): Promise<Result<void>> {
    await this.requestPermissions();

    try {
      await BlackoutGeoModule.startTracking();
      return { ok: true, data: undefined };
    } catch (error: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: error.message, retryable: true, module: 'GEO' } };
    }
  }

  async stopTracking(): Promise<Result<void>> {
    try {
      await BlackoutGeoModule.stopTracking();
      return { ok: true, data: undefined };
    } catch (error: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: error.message, retryable: false, module: 'GEO' } };
    }
  }

  async getCurrentLocation(): Promise<Result<LocationDto>> {
    try {
      const loc = await BlackoutGeoModule.getCurrentLocation();
      return { ok: true, data: loc as LocationDto };
    } catch (error: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: error.message, retryable: true, module: 'GEO' } };
    }
  }

  async calculateRoute(start: LocationDto, destination: LocationDto, options: RouteOptions): Promise<Result<RouteDto>> {
    try {
      const route = await BlackoutGeoModule.calculateRoute(start, destination, options);
      return { ok: true, data: route as RouteDto };
    } catch (error: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: error.message, retryable: false, module: 'GEO' } };
    }
  }

  async calculateDistance(a: LocationDto, b: LocationDto): Promise<Result<number>> {
    const R = 6371e3; // metres
    const phi1 = (a.latitude * Math.PI) / 180;
    const phi2 = (b.latitude * Math.PI) / 180;
    const deltaPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
    const deltaLambda = ((b.longitude - a.longitude) * Math.PI) / 180;

    const x = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    const d = R * c;

    return { ok: true, data: Math.round(d) };
  }

  
  async loadOfflineMap(region: any): Promise<Result<any>> {
    try {
      const jsonStr = await BlackoutGeoModule.loadOfflineMap(JSON.stringify(region));
      const parsed = JSON.parse(jsonStr);
      // The Java bridge now returns 'path' for the MBTiles file
      return { ok: true, data: parsed };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: false, module: 'GEO' } };
    }
  }

  async addHazard(hazard: any): Promise<Result<any>> {
    return { ok: true, data: {} as any };
  }

  async findNearby(type: any, location: any, radiusM: number): Promise<Result<any>> {
    try {
      const jsonStr = await BlackoutGeoModule.findNearby(type, JSON.stringify(location), radiusM);
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: false, module: 'GEO' } };
    }
  }

  async getHazards(region: any): Promise<Result<HazardDto[]>> {
    try {
      const jsonStr = await BlackoutGeoModule.getHazards(JSON.stringify(region));
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: false, module: 'GEO' } };
    }
  }

  observeLocation(listener: (event: any) => void): () => void {
    this.startTracking().catch(() => {});
    const sub = geoEmitter ? geoEmitter.addListener('LOCATION_UPDATED', (location: any) => {
      listener({ type: 'LOCATION_UPDATED', location });
    }) : null;
    return () => {
      if (sub) sub.remove();
      this.stopTracking().catch(() => {});
    };
  }
}
