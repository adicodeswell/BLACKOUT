const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/maxzoom: 19/g, 'maxzoom: 22');

fs.writeFileSync(path, code);
