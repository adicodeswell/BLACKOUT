const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const target1 = `            tiles: [\`mbtiles://\${offlineMapResult.path}\`]`;
const inject1 = `            // tiles: [\`mbtiles://\${offlineMapResult.path}\`] // UNCOMMENT THIS WHEN YOU HAVE A REAL 50MB .mbtiles FILE
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] // Temporary online fallback for visual testing`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
