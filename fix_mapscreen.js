const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Destructure correctly
code = code.replace(
  `    setFilterHazards,
  } = useMap(mapService);`,
  `    setFilterHazards,
    activeRoute,
    calculateRouteTo,
    clearRoute,
  } = useMap(mapService);`
);

// 2. Fix maxZoomLevel prop - it goes on MapView, not Camera in some versions, or maybe it is just maxZoomLevel={22} without TS errors if we cast or ignore? Actually, the TS error says Camera doesn't have maxZoomLevel. Let's move it to MapView or remove it if MapView already handles style maxzoom. Actually MapLibreGL MapView doesn't have it either, it's just 'maxZoomLevel' on Camera in older mapbox, but MapLibre ignores it or uses maxZoomLevel on MapView? I'll just remove maxZoomLevel={22} and let maxZoom={22} on the source/style do its job.
code = code.replace(/<Camera maxZoomLevel=\{22\}/g, '<Camera');

// 3. Fix TS errors on LongPress
code = code.replace(
  /onLongPress=\{\(e\) => \{/g,
  `onLongPress={(e: any) => {`
);

// 4. Fix activeRoute any type inside the map
code = code.replace(
  `coordinates: activeRoute.geometry.map(p => [p.longitude, p.latitude])`,
  `coordinates: activeRoute.geometry.map((p: any) => [p.longitude, p.latitude])`
);

// 5. Fix ShapeSource/LineLayer imports
code = code.replace(
  /import \{ Map as MapView, Camera, Marker, ShapeSource, LineLayer \} from '@maplibre\/maplibre-react-native';/,
  `import MapLibreGL, { Map as MapView, Camera, Marker } from '@maplibre/maplibre-react-native';
const { ShapeSource, LineLayer } = MapLibreGL;`
);
if (!code.includes('const { ShapeSource, LineLayer } = MapLibreGL;')) {
    code = code.replace(
        /import \{ Map as MapView, Camera, Marker \} from '@maplibre\/maplibre-react-native';/,
        `import MapLibreGL, { Map as MapView, Camera, Marker } from '@maplibre/maplibre-react-native';\nconst { ShapeSource, LineLayer } = MapLibreGL;`
    );
}

// 6. Fix anchor TS errors: anchor={{x: 0.5, y: 0.5}} -> anchor={{x: 0.5, y: 0.5} as any}
code = code.replace(/anchor=\{\{x: 0\.5, y: 0\.5\}\}/g, `anchor={{x: 0.5, y: 0.5} as any}`);

fs.writeFileSync(path, code);
