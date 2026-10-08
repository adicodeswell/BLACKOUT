const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  async loadOfflineMap(region: any): Promise<Result<any>> {
    try {
      const jsonStr = await BlackoutGeoModule.loadOfflineMap(JSON.stringify(region));
      return { ok: true, data: JSON.parse(jsonStr) };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: false, module: 'GEO' } };
    }
  }`;

const inject1 = `  async loadOfflineMap(region: any): Promise<Result<any>> {
    try {
      const jsonStr = await BlackoutGeoModule.loadOfflineMap(JSON.stringify(region));
      const parsed = JSON.parse(jsonStr);
      // The Java bridge now returns 'path' for the MBTiles file
      return { ok: true, data: parsed };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: false, module: 'GEO' } };
    }
  }`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
