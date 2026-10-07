const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace handleRecenter
const oldHandleRecenterRegex = /const handleRecenter = useCallback\(async \(\) => \{[\s\S]*?\}, \[centerOnLocation\]\);/;
const newHandleRecenter = `const handleRecenter = useCallback(async () => {
    const loc = await centerOnLocation();
    if (loc?.latitude && loc?.longitude) {
      setCenterCoordinate([loc.longitude, loc.latitude]);
      setZoomLevel(15);
      if (cameraRef.current) {
        cameraRef.current.flyTo({
          center: [loc.longitude, loc.latitude],
          zoom: 15,
          duration: 1200
        });
      }
    }
  }, [centerOnLocation]);`;
code = code.replace(oldHandleRecenterRegex, newHandleRecenter);

// Replace Camera
const oldCameraRegex = /<Camera[\s\S]*?\/>/;
const newCamera = `<Camera
            ref={cameraRef}
            center={centerCoordinate}
            zoom={zoomLevel}
            duration={400}
          />`;
code = code.replace(oldCameraRegex, newCamera);

fs.writeFileSync(path, code);
