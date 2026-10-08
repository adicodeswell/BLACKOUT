const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `    public BlackoutGeoModule(ReactApplicationContext reactContext) {
        super(reactContext);
        locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
    }`,
  `    public BlackoutGeoModule(ReactApplicationContext reactContext) {
        super(reactContext);
        locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
        try {
            com.blackout.geolocation.OfflineGeoEngine.LocationProvider provider = new com.blackout.geolocation.OfflineGeoEngine.LocationProvider() {
                @Override
                public com.blackout.geolocation.OfflineGeoEngine.LocationSample getCurrentLocation() {
                    if (lastKnownLocation == null) return null;
                    return new com.blackout.geolocation.OfflineGeoEngine.LocationSample(lastKnownLocation.getLatitude(), lastKnownLocation.getLongitude(), lastKnownLocation.getAccuracy(), lastKnownLocation.getTime());
                }
                @Override
                public Runnable observe(com.blackout.geolocation.OfflineGeoEngine.LocationListener listener) { return () -> {}; }
            };
            geoEngine = new com.blackout.geolocation.OfflineGeoEngine(provider, new com.blackout.geolocation.LocationValidator(), new com.blackout.geolocation.OfflineMapManager(java.util.Collections.emptyList()));
        } catch(Exception e) {}
    }`
);

fs.writeFileSync(path, code);
