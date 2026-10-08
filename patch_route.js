const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `const route = await BlackoutGeoModule.calculateRoute(start, destination, options);
      return { ok: true, data: route as RouteDto };`,
  `const route = await BlackoutGeoModule.calculateRoute(start, destination, options);
      
      // Map Java's 'path' array to TS 'geometry' array
      if (route && route.path && !route.geometry) {
        route.geometry = route.path;
      }
      
      return { ok: true, data: route as RouteDto };`
);

fs.writeFileSync(path, code);
