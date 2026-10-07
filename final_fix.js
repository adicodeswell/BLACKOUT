const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const regexFly = /cameraRef\.current\.setCamera\(\{\s*centerCoordinate: \[loc\.longitude, loc\.latitude\],\s*zoomLevel: 15,\s*animationDuration: 1200\s*\}\);/;
const newFly = `cameraRef.current.flyTo({
          center: [loc.longitude, loc.latitude],
          zoom: 15,
          duration: 1200
        });`;
code = code.replace(regexFly, newFly);

fs.writeFileSync(path, code);
