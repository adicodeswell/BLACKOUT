const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

// Fix LocationSample
code = code.replace(
  /new OfflineGeoEngine.LocationSample\(\s*lastKnownLocation.getLatitude\(\),\s*lastKnownLocation.getLongitude\(\),\s*lastKnownLocation.getAltitude\(\),\s*lastKnownLocation.getAccuracy\(\),\s*lastKnownLocation.getTime\(\)\s*\)/s,
  'new OfflineGeoEngine.LocationSample(lastKnownLocation.getLatitude(), lastKnownLocation.getLongitude(), lastKnownLocation.getAccuracy(), lastKnownLocation.getTime())'
);

// Fix Route computation result handling
code = code.replace(
  'if (result != null && result.isSuccess()) {',
  'if (result != null) {'
);

code = code.replace(
  'out.putDouble("distance_m", result.getTotalDistanceMeters());',
  'out.putDouble("distance_m", result.getDistanceM());'
);

code = code.replace(
  'out.putDouble("duration_s", result.getEstimatedDurationSeconds());',
  'out.putDouble("duration_s", result.getDurationS());'
);

code = code.replace(
  'for (GeoPoint pt : result.getPath()) {',
  'for (GeoPoint pt : result.getGeometry()) {'
);

fs.writeFileSync(path, code);
