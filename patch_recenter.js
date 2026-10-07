const fs = require('fs');
const path = 'src/hooks/useMap.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const centerOnLocation = useCallback(async () => {\\n    await acquireLocation();',
  'const centerOnLocation = useCallback(async () => {\\n    const loc = await acquireLocation();'
);

// We need to return loc from acquireLocation
const acqLocTarget = `const acquireLocation = useCallback(async () => {
    setLocationState('LOADING');
    setLocationError(null);

    try {
      const locRes = await mapService.getCurrentLocation();
      if (locRes.ok) {
        setCurrentLocation(locRes.data);
        setLocationState('SUCCESS');
      } else {`;
      
const acqLocRep = `const acquireLocation = useCallback(async () => {
    setLocationState('LOADING');
    setLocationError(null);

    try {
      const locRes = await mapService.getCurrentLocation();
      if (locRes.ok) {
        setCurrentLocation(locRes.data);
        setLocationState('SUCCESS');
        return locRes.data;
      } else {`;

code = code.replace(acqLocTarget, acqLocRep);

// And we need to fix handleRecenter in MapScreen.tsx!
const path2 = 'src/screens/MapScreen.tsx';
let code2 = fs.readFileSync(path2, 'utf8');

const target2 = `const handleRecenter = useCallback(async () => {
    await centerOnLocation();
    if (currentLocation?.latitude && currentLocation?.longitude) {
      setCenterCoordinate([currentLocation.longitude, currentLocation.latitude]);
      setZoomLevel(14);
    }
  }, [centerOnLocation, currentLocation]);`;

const rep2 = `const handleRecenter = useCallback(async () => {
    await centerOnLocation();
    // We will just read the mapService directly as a quick fix or rely on the effect below
  }, [centerOnLocation]);`;
  
code2 = code2.replace(target2, rep2);

fs.writeFileSync(path, code);
fs.writeFileSync(path2, code2);
