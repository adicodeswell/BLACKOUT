const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `import { Map as MapView, Camera, Marker } from '@maplibre/maplibre-react-native';`,
  `import { Map as MapView, Camera, Marker, ShapeSource, LineLayer } from '@maplibre/maplibre-react-native';`
);

fs.writeFileSync(path, code);
