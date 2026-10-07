const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/GEO_INIT_FAILED/g, 'UNAVAILABLE');
code = code.replace(/TRACKING_FAILED/g, 'UNAVAILABLE');
code = code.replace(/TRACKING_STOP_FAILED/g, 'UNAVAILABLE');
code = code.replace(/NO_LOCATION/g, 'UNAVAILABLE');
code = code.replace(/ROUTE_CALC_FAILED/g, 'UNAVAILABLE');

code = code.replace(/async getHazards\(bounds: \{ n: number; s: number; e: number; w: number \}\)/g, 'async getHazards(region: any)');

fs.writeFileSync(path, code);
