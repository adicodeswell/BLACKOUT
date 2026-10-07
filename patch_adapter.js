const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const missingMethod = `
  async loadOfflineMap(region: any): Promise<Result<any>> {
    // Phase 2: Offline Map loading logic via MapLibre
    // For now, return success to let the map render the grid
    return { ok: true, data: { status: 'LOADED', regionId: region.id, offlineReady: true } };
  }
`;

code = code.replace(
  'async getHazards',
  missingMethod + '\n  async getHazards'
);

fs.writeFileSync(path, code);
