const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const regexCam = /<Camera[\s\S]*?\/>/;
const newCam = `<Camera
            ref={cameraRef}
            centerCoordinate={centerCoordinate}
            zoomLevel={zoomLevel}
            animationDuration={400}
          />`;
code = code.replace(regexCam, newCam);

const regexFly = /cameraRef\.current\.flyTo\(\{[\s\S]*?\}\);/;
const newFly = `cameraRef.current.setCamera({
          centerCoordinate: [loc.longitude, loc.latitude],
          zoomLevel: 15,
          animationDuration: 1200
        });`;
code = code.replace(regexFly, newFly);

fs.writeFileSync(path, code);
