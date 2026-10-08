const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `onLongPress={(e: any) => {
            const coord = e.geometry.coordinates;
            calculateRouteTo({ latitude: coord[1], longitude: coord[0], accuracy_m: 0, captured_at: Date.now() });
          }}`,
  `onLongPress={(e: any) => {
            const coord = e.lngLat || (e.nativeEvent && e.nativeEvent.lngLat) || (e.geometry && e.geometry.coordinates) || [];
            if (coord && coord.length >= 2) {
                calculateRouteTo({ latitude: coord[1], longitude: coord[0], accuracy_m: 0, captured_at: Date.now() });
            }
          }}`
);

fs.writeFileSync(path, code);
