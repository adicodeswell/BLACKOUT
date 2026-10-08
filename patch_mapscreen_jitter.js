const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add maxZoomLevel to Camera
code = code.replace(
  '<Camera',
  '<Camera maxZoomLevel={22}'
);

// 2. Add anchor={ {x: 0.5, y: 0.5} } to all Markers
code = code.replace(
  /lngLat=\{\[/g,
  'anchor={{x: 0.5, y: 0.5}} lngLat={['
);

fs.writeFileSync(path, code);
