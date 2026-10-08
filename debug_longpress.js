const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { Alert }")) {
  code = code.replace("import { View, Text,", "import { View, Text, Alert,");
}

code = code.replace(
  `const coord = e.lngLat || (e.nativeEvent && e.nativeEvent.lngLat) || (e.geometry && e.geometry.coordinates) || [];
            if (coord && coord.length >= 2) {
                calculateRouteTo({ latitude: coord[1], longitude: coord[0], accuracy_m: 0, captured_at: Date.now() });
            }`,
  `const coord = e.lngLat || (e.nativeEvent && e.nativeEvent.lngLat) || (e.geometry && e.geometry.coordinates) || (e.coordinates) || [];
            if (coord && coord.length >= 2) {
                // Alert.alert("Tapped!", JSON.stringify(coord));
                calculateRouteTo({ latitude: coord[1], longitude: coord[0], accuracy_m: 0, captured_at: Date.now() }).catch(err => Alert.alert("Error", String(err)));
            } else {
                Alert.alert("Coord Missing", JSON.stringify(e));
            }`
);

fs.writeFileSync(path, code);
