const fs = require('fs');
const path = 'src/hooks/useMap.ts';
let code = fs.readFileSync(path, 'utf8');

// Imports
code = code.replace(
  `import type { MapLoadResult } from '../contracts/geo/RouteDto';`,
  `import type { MapLoadResult, RouteDto } from '../contracts/geo/RouteDto';`
);

// Interface UseMapResult
code = code.replace(
  `  setFilterResources: (active: boolean) => void;
  setFilterHazards: (active: boolean) => void;
}`,
  `  setFilterResources: (active: boolean) => void;
  setFilterHazards: (active: boolean) => void;
  activeRoute: RouteDto | null;
  calculateRouteTo: (dest: LocationDto) => Promise<void>;
  clearRoute: () => void;
}`
);

// Hook definition
code = code.replace(
  `const [mapError, setMapError] = useState<string | null>(null);`,
  `const [mapError, setMapError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteDto | null>(null);`
);

// Hook logic
code = code.replace(
  `const selectMarker = useCallback((marker: SelectedMarker | null) => {`,
  `const calculateRouteTo = useCallback(async (dest: LocationDto) => {
    if (!currentLocation) return;
    const res = await mapService.calculateRoute(currentLocation, dest);
    if (res.ok) {
      setActiveRoute(res.data);
    }
  }, [currentLocation, mapService]);

  const clearRoute = useCallback(() => setActiveRoute(null), []);

  const selectMarker = useCallback((marker: SelectedMarker | null) => {`
);

// Return value
code = code.replace(
  `    setFilterHazards,
  };`,
  `    setFilterHazards,
    activeRoute,
    calculateRouteTo,
    clearRoute,
  };`
);

fs.writeFileSync(path, code);
