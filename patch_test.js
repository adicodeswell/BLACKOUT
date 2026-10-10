const fs = require('fs');
const file = 'tests/integration/MeshRegression.test.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace('implements Partial<DataEngine>', '');
code = code.replace('implements NetworkEngine', '');
fs.writeFileSync(file, code);
