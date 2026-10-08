const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `new AStarRouter.Options(true, true, 5, 200)`,
  `new AStarRouter.Options(true, true, 4, 200)`
);

fs.writeFileSync(path, code);
