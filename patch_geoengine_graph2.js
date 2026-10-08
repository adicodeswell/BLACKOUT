const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/geolocation/OfflineGeoEngine.java';
let code = fs.readFileSync(path, 'utf8');

// Replace the previous injection
code = code.replace(
  `        if (activeGraph == null || activeRegion == null) {
            // DYNAMIC GRAPH GENERATION FOR TESTING`,
  `        if (true) {
            // ALWAYS DYNAMIC GRAPH GENERATION FOR TESTING`
);

fs.writeFileSync(path, code);
