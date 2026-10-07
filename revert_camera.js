const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '<Camera\\n            ref={cameraRef}\\n            centerCoordinate={centerCoordinate}\\n            zoomLevel={zoomLevel}\\n            animationDuration={400}\\n          />',
  '<Camera\\n            ref={cameraRef}\\n            center={centerCoordinate}\\n            zoom={zoomLevel}\\n            duration={400}\\n          />'
);

fs.writeFileSync(path, code);
