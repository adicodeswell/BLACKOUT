const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

const targetCons = `    public BlackoutGeoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }`;

const replaceCons = `    public BlackoutGeoModule(ReactApplicationContext reactContext) {
        super(reactContext);
        locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
    }`;

code = code.replace(targetCons, replaceCons);

fs.writeFileSync(path, code);
