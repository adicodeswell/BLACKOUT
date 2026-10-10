const fs = require('fs');
const file = 'src/screens/DirectMessageScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `const isOutgoing = item.origin_device_id === 'self-node-01' || item.destination_device_id === peerId;`,
  `const isOutgoing = item.destination_device_id === peerId;`
);
fs.writeFileSync(file, content);
