const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'BlackoutGeoModule.startTracking().catch(() => {});',
  'this.startTracking().catch(() => {});'
);

code = code.replace(
  'BlackoutGeoModule.stopTracking().catch(() => {});',
  'this.stopTracking().catch(() => {});'
);

fs.writeFileSync(path, code);
