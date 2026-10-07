const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/bridge/BlackoutGeoModule.java';
let code = fs.readFileSync(path, 'utf8');

const target1 = `Location loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);`;
const replacement1 = `
                Location loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (loc == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
`;

const target2 = `locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        2000, // 2 seconds minimum interval
                        5f,   // 5 meters minimum distance
                        androidLocationListener
                );`;
const replacement2 = `
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        2000, 5f, androidLocationListener
                );
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                            LocationManager.NETWORK_PROVIDER,
                            2000, 5f, androidLocationListener
                    );
                }
`;

code = code.replace(target1, replacement1);
// Because target1 appears twice (in startTracking and getCurrentLocation), replace the second one too
code = code.replace(target1, replacement1); 
code = code.replace(target2, replacement2);

fs.writeFileSync(path, code);
