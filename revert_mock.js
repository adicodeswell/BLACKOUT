const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

const mockTarget = `                WritableMap locMap = Arguments.createMap();
                locMap.putDouble("latitude", 22.5726);
                locMap.putDouble("longitude", 88.3639);
                locMap.putDouble("accuracy", 10.0);
                locMap.putDouble("altitude", 0.0);
                locMap.putDouble("timestamp", System.currentTimeMillis());
                promise.resolve(locMap);`;

code = code.replace(mockTarget, `promise.reject("UNAVAILABLE", "Location not yet acquired (waiting for sensor lock)");`);

fs.writeFileSync(path, code);
