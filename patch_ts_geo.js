const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  async loadOfflineMap(region: any): Promise<Result<any>> {
    // Phase 2: Offline Map loading logic via MapLibre
    // For now, return success to let the map render the grid
    return { ok: true, data: { status: 'LOADED', regionId: region.id, offlineReady: true } };
  }

  
  async addHazard(hazard: any): Promise<Result<any>> {
    return { ok: true, data: {} as any };
  }

  async findNearby(type: any, location: any, radiusM: number): Promise<Result<any>> {
    return { ok: true, data: [] };
  }
  async getHazards(region: any): Promise<Result<HazardDto[]>> {
    // In production, hazards are fetched from DataEngine. 
    // The GeoEngine only uses them for routing calculation.
    return { ok: true, data: [] };
  }`;

const inject1 = `  async loadOfflineMap(region: any): Promise<Result<any>> {
    try {
      const jsonStr = await BlackoutGeoModule.loadOfflineMap(JSON.stringify(region));
      return { ok: true, data: JSON.parse(jsonStr) };
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
  }`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
