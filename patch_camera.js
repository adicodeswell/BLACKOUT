const fs = require('fs');

// 1. Fix useMap.ts
const pathHook = 'src/hooks/useMap.ts';
let codeHook = fs.readFileSync(pathHook, 'utf8');

codeHook = codeHook.replace(
  'centerOnLocation: () => Promise<void>;',
  'centerOnLocation: () => Promise<LocationDto | null>;'
);

const oldCenter = `  const centerOnLocation = useCallback(async () => {
    await acquireLocation();
    if (currentLocation) {
      setSelectedMarker({ type: 'LOCATION', data: currentLocation });
    }
  }, [acquireLocation, currentLocation]);`;

const newCenter = `  const centerOnLocation = useCallback(async () => {
    const loc = await acquireLocation();
    const finalLoc = loc || currentLocation;
    if (finalLoc) {
      setSelectedMarker({ type: 'LOCATION', data: finalLoc });
    }
    return finalLoc || null;
  }, [acquireLocation, currentLocation]);`;

if (codeHook.includes(oldCenter)) {
  codeHook = codeHook.replace(oldCenter, newCenter);
} else {
  console.log("Could not find old centerOnLocation");
}
fs.writeFileSync(pathHook, codeHook);

// 2. Fix MapScreen.tsx
const pathScreen = 'src/screens/MapScreen.tsx';
let codeScreen = fs.readFileSync(pathScreen, 'utf8');

if (!codeScreen.includes('cameraRef')) {
  codeScreen = codeScreen.replace(
    'const [showLegend, setShowLegend] = useState<boolean>(false);',
    'const [showLegend, setShowLegend] = useState<boolean>(false);\n  const cameraRef = useRef<any>(null);'
  );
  
  codeScreen = codeScreen.replace(
    `import React, { useEffect, useMemo, useState } from 'react';`,
    `import React, { useEffect, useMemo, useState, useRef } from 'react';`
  );

  const oldHandleRecenter = `  const handleRecenter = useCallback(async () => {
    await centerOnLocation();
    // We will just read the mapService directly as a quick fix or rely on the effect below
  }, [centerOnLocation]);`;

  const newHandleRecenter = `  const handleRecenter = useCallback(async () => {
    const loc = await centerOnLocation();
    if (loc?.latitude && loc?.longitude) {
      setCenterCoordinate([loc.longitude, loc.latitude]);
      setZoomLevel(15);
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [loc.longitude, loc.latitude],
          zoomLevel: 15,
          animationDuration: 800,
        });
      }
    }
  }, [centerOnLocation]);`;

  codeScreen = codeScreen.replace(oldHandleRecenter, newHandleRecenter);
  
  const oldCamera = `<Camera
            center={centerCoordinate}
            zoom={zoomLevel}
            duration={400}
          />`;
          
  const newCamera = `<Camera
            ref={cameraRef}
            centerCoordinate={centerCoordinate}
            zoomLevel={zoomLevel}
            animationDuration={400}
          />`;
          
  codeScreen = codeScreen.replace(oldCamera, newCamera);
  codeScreen = codeScreen.replace(/center=\{centerCoordinate\}/g, 'centerCoordinate={centerCoordinate}');
  codeScreen = codeScreen.replace(/zoom=\{zoomLevel\}/g, 'zoomLevel={zoomLevel}');
}

fs.writeFileSync(pathScreen, codeScreen);
