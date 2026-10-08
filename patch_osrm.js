const fs = require('fs');
const path = 'src/hooks/useMap.ts';
let code = fs.readFileSync(path, 'utf8');

const osrmLogic = `const calculateRouteTo = useCallback(async (dest: LocationDto) => {
    if (!currentLocation) {
        Alert.alert("Error", "Current Location is missing. Cannot route.");
        return;
    }
    
    // Using OSRM Public API to trace real streets since offline graph data isn't bundled yet
    try {
      const url = \`https://router.project-osrm.org/route/v1/walking/\${currentLocation.longitude},\${currentLocation.latitude};\${dest.longitude},\${dest.latitude}?overview=full&geometries=geojson\`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c: any) => ({
          longitude: c[0],
          latitude: c[1]
        }));
        
        setActiveRoute({
          route_id: 'osrm-route',
          origin: currentLocation,
          destination: dest,
          distance_m: route.distance,
          duration_s: route.duration,
          geometry: coordinates,
          avoided_hazard_ids: [],
          calculated_at: Date.now()
        });
      } else {
        Alert.alert("Route Error", "Could not find a path along real roads.");
      }
    } catch(e: any) {
      Alert.alert("Route Error", "Failed to reach OSRM routing server.");
    }
  }, [currentLocation]);`;

const regex = /const calculateRouteTo = useCallback\(async \(dest: LocationDto\) => \{[\s\S]*?\}, \[currentLocation, mapService\]\);/;
code = code.replace(regex, osrmLogic);

fs.writeFileSync(path, code);
