const fs = require('fs');
const path = 'src/services/PeopleService.ts';
let code = fs.readFileSync(path, 'utf8');

const classDecl = `export class PeopleService {`;
const classDeclNew = `export class PeopleService {
  private localNodeId = "node_" + Math.random().toString(36).substring(2, 9);`;

code = code.replace(classDecl, classDeclNew);
fs.writeFileSync(path, code);
