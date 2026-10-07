const fs = require('fs');
const path = 'src/services/ServiceContext.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `    const devGeoEngine = new DevGeoEngine();
    const geoEngine: GeoEngine = overrides?.geoEngine || new GeoEngineAdapter(devGeoEngine);`;

const replacement = `    const geoEngine: GeoEngine = overrides?.geoEngine || 
      (Platform.OS === 'android' && NativeModules.BlackoutGeoModule
        ? new NativeGeoEngineAdapter()
        : new GeoEngineAdapter(new DevGeoEngine()));`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
