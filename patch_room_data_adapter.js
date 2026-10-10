const fs = require('fs');
const file = 'src/adapters/data/RoomDataEngineAdapter.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `reporter_device_id: (request as any).reporter_device_id || "self-node-01",`,
  `reporter_device_id: (request as any).reporter_device_id || "unknown-node",`
);
fs.writeFileSync(file, content);
