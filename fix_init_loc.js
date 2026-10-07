const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const [zoomLevel, setZoomLevel] = useState<number>(13);',
  'const [zoomLevel, setZoomLevel] = useState<number>(2);'
);
code = code.replace(
  'const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>([88.3639, 22.5726]);',
  'const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>([0.0, 0.0]);'
);

fs.writeFileSync(path, code);
