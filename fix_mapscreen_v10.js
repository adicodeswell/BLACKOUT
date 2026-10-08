const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix Imports
code = code.replace(
  `import MapLibreGL, { Map as MapView, Camera, Marker } from '@maplibre/maplibre-react-native';
const { ShapeSource, LineLayer } = MapLibreGL;`,
  `import { Map as MapView, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';`
);

// Fallback if the previous regex already ran differently:
if (code.includes('import { Map as MapView, Camera, Marker } from \'@maplibre/maplibre-react-native\';\nconst { ShapeSource, LineLayer } = MapLibreGL;')) {
    code = code.replace(
      `import { Map as MapView, Camera, Marker } from '@maplibre/maplibre-react-native';\nconst { ShapeSource, LineLayer } = MapLibreGL;`,
      `import { Map as MapView, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';`
    );
}

// 2. Fix JSX elements
code = code.replace(/<ShapeSource/g, '<GeoJSONSource');
code = code.replace(/<\/ShapeSource>/g, '</GeoJSONSource>');
code = code.replace(/<LineLayer/g, '<Layer type="line"');
code = code.replace(/shape=\{\{/g, 'data={{'); // ShapeSource uses `shape`, GeoJSONSource uses `data`

// 3. Fix exact error 273 (LocationDto missing accuracy_m)
code = code.replace(
  `calculateRouteTo({ latitude: coord[1], longitude: coord[0], captured_at: Date.now() });`,
  `calculateRouteTo({ latitude: coord[1], longitude: coord[0], accuracy_m: 0, captured_at: Date.now() });`
);

fs.writeFileSync(path, code);
