const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Destructure activeRoute and actions from useMap
code = code.replace(
  `    setFilterResources,
    setFilterHazards,
  } = useMap(resolvedMapService);`,
  `    setFilterResources,
    setFilterHazards,
    activeRoute,
    calculateRouteTo,
    clearRoute,
  } = useMap(resolvedMapService);`
);

// 2. Add ShapeSource and LineLayer imports (already imported MapView, Camera, Marker, probably ShapeSource and LineLayer are missing)
if (!code.includes('ShapeSource')) {
  code = code.replace(
    /import MapLibreGL, \{ MapView, Camera, Marker \} from '@maplibre\/maplibre-react-native';/,
    `import MapLibreGL, { MapView, Camera, Marker, ShapeSource, LineLayer } from '@maplibre/maplibre-react-native';`
  );
}

// 3. Handle Map long press
code = code.replace(
  `onPress={() => selectMarker(null)}`,
  `onPress={() => { selectMarker(null); clearRoute(); }}
          onLongPress={(e) => {
            const coord = e.geometry.coordinates;
            calculateRouteTo({ latitude: coord[1], longitude: coord[0], captured_at: Date.now() });
          }}`
);

// 4. Render Route geometry
const renderRouteInjection = `          {/* Route Rendering */}
          {activeRoute && activeRoute.geometry && activeRoute.geometry.length > 0 && (
            <ShapeSource
              id="active-route"
              shape={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: activeRoute.geometry.map(p => [p.longitude, p.latitude])
                }
              }}
            >
              <LineLayer
                id="route-line-halo"
                style={{
                  lineColor: theme.colors.surface,
                  lineWidth: 6,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <LineLayer
                id="route-line"
                style={{
                  lineColor: theme.colors.primary,
                  lineWidth: 4,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineDasharray: [2, 2],
                }}
              />
            </ShapeSource>
          )}

          {/* Current Location Marker */}`;

code = code.replace(`          {/* Current Location Marker */}`, renderRouteInjection);

fs.writeFileSync(path, code);
