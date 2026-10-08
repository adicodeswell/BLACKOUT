const fs = require('fs');
const path = 'src/hooks/useMap.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `const calculateRouteTo = useCallback(async (dest: LocationDto) => {
    if (!currentLocation) return;
    const res = await mapService.calculateRoute(currentLocation, dest);
    if (res.ok) {
      setActiveRoute(res.data);
    }
  }, [currentLocation, mapService]);`,
  `const calculateRouteTo = useCallback(async (dest: LocationDto) => {
    if (!currentLocation) {
        // Alert if currentLocation is missing
        console.warn("calculateRouteTo: currentLocation is null!");
        return;
    }
    console.log("Calculating route from", currentLocation, "to", dest);
    const res = await mapService.calculateRoute(currentLocation, dest);
    console.log("Route Result:", res);
    if (res.ok) {
      setActiveRoute(res.data);
    } else {
      console.error("Route Error", res.error);
    }
  }, [currentLocation, mapService]);`
);

fs.writeFileSync(path, code);
