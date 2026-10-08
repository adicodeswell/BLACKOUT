const fs = require('fs');
const path = 'src/services/PeopleService.ts';
let code = fs.readFileSync(path, 'utf8');

const idGenerator = `  private readonly networkEngine: NetworkEngine;
  private readonly dataEngine: DataEngine;
  
  private localNodeId = "node_" + Math.random().toString(36).substring(2, 9);`;

code = code.replace(
  `  private readonly networkEngine: NetworkEngine;
  private readonly dataEngine: DataEngine;`,
  idGenerator
);

const oldOrigin = `origin_device_id: "self-node-01",`;
const newOrigin = `origin_device_id: this.localNodeId,`;

code = code.replace(oldOrigin, newOrigin);

fs.writeFileSync(path, code);
