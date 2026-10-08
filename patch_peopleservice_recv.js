const fs = require('fs');
const path = 'src/services/PeopleService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `if (msg.message_type === "DIRECT") {`,
  `if (msg.message_type === "DIRECT" || msg.message_type === "BROADCAST") {`
);

fs.writeFileSync(path, code);
