const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `if (route && route.path && !route.geometry) {
        route.geometry = route.path;
      }`,
  `if (route && (route as any).path && !route.geometry) {
        route.geometry = (route as any).path;
      }`
);

fs.writeFileSync(path, code);
