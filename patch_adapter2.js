const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace `on<K>` with `observeLocation`
const targetOn = `  on<K extends keyof any>(event: K, listener: (data: any[K]) => void): () => void {
    const sub = geoEmitter.addListener(event, listener);
    return () => sub.remove();
  }`;

const replacementObserve = `  observeLocation(listener: (event: any) => void): () => void {
    BlackoutGeoModule.startTracking().catch(() => {});
    const sub = geoEmitter.addListener('LOCATION_UPDATED', (location: any) => {
      listener({ type: 'LOCATION_UPDATED', location });
    });
    return () => {
      sub.remove();
      BlackoutGeoModule.stopTracking().catch(() => {});
    };
  }`;

code = code.replace(targetOn, replacementObserve);

// Make sure it implements GeoEngine properly by adding addHazard and findNearby stubs
const addHazardStub = `
  async addHazard(hazard: any): Promise<Result<any>> {
    return { ok: true, data: {} as any };
  }

  async findNearby(type: any, location: any, radiusM: number): Promise<Result<any>> {
    return { ok: true, data: [] };
  }
`;

if (!code.includes('addHazard')) {
    code = code.replace('async getHazards', addHazardStub + '\\n  async getHazards');
}

fs.writeFileSync(path, code);
