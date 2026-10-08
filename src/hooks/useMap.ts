import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import type { MapService } from '../services/MapService';
import type { LocationDto } from '../contracts/geo/LocationDto';
import type { HazardDto } from '../contracts/geo/HazardDto';
import type { IncidentDto } from '../contracts/data/IncidentDto';
import type { ResourceDto } from '../contracts/data/ResourceDto';
import type { MapLoadResult, RouteDto } from '../contracts/geo/RouteDto';

export type LocationState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR' | 'UNAVAILABLE';
export type MapLoadingState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

export type SelectedMarker =
  | { type: 'INCIDENT'; data: IncidentDto }
  | { type: 'RESOURCE'; data: ResourceDto }
  | { type: 'HAZARD'; data: HazardDto }
  | { type: 'LOCATION'; data: LocationDto };

export interface UseMapResult {
  mapLoadingState: MapLoadingState;
  offlineMapResult: MapLoadResult | null;
  locationState: LocationState;
  currentLocation: LocationDto | null;
  locationError: string | null;
  incidents: IncidentDto[];
  resources: ResourceDto[];
  hazards: HazardDto[];
  selectedMarker: SelectedMarker | null;
  mapError: string | null;
  refreshMap: () => Promise<void>;
  centerOnLocation: () => Promise<LocationDto | null>;
  selectMarker: (marker: SelectedMarker | null) => void;
  filterIncidents: boolean;
  filterResources: boolean;
  filterHazards: boolean;
  setFilterIncidents: (active: boolean) => void;
  setFilterResources: (active: boolean) => void;
  setFilterHazards: (active: boolean) => void;
  activeRoute: RouteDto | null;
  calculateRouteTo: (dest: LocationDto) => Promise<void>;
  clearRoute: () => void;
}

export const useMap = (mapService: MapService): UseMapResult => {
  const [mapLoadingState, setMapLoadingState] = useState<MapLoadingState>('IDLE');
  const [offlineMapResult, setOfflineMapResult] = useState<MapLoadResult | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('IDLE');
  const [currentLocation, setCurrentLocation] = useState<LocationDto | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<IncidentDto[]>([]);
  const [resources, setResources] = useState<ResourceDto[]>([]);
  const [hazards, setHazards] = useState<HazardDto[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteDto | null>(null);

  const [filterIncidents, setFilterIncidents] = useState<boolean>(true);
  const [filterResources, setFilterResources] = useState<boolean>(true);
  const [filterHazards, setFilterHazards] = useState<boolean>(true);

  const unobserveRef = useRef<(() => void) | null>(null);

  const loadData = useCallback(async () => {
    setMapLoadingState('LOADING');
    setMapError(null);

    try {
      // 1. Offline Map availability check
      const offlineRes = await mapService.loadOfflineMap();
      if (offlineRes.ok) {
        setOfflineMapResult(offlineRes.data);
      } else {
        setOfflineMapResult({
          region: { min_latitude: 37.7, min_longitude: -122.5, max_latitude: 37.8, max_longitude: -122.3 },
          available: false,
          source: 'LOCAL_CACHE',
        });
      }

      // 2. Fetch Hazards, Incidents, Resources in parallel
      const [hazRes, incRes, resRes] = await Promise.all([
        mapService.getHazards(),
        mapService.getIncidents(),
        mapService.getResources(),
      ]);

      if (hazRes.ok) {
        setHazards(hazRes.data);
      }
      if (incRes.ok) {
        setIncidents(incRes.data);
      }
      if (resRes.ok) {
        setResources(resRes.data);
      }

      setMapLoadingState('SUCCESS');
    } catch (err: any) {
      setMapLoadingState('ERROR');
      setMapError(err?.message || 'Failed to initialize offline map data');
    }
  }, [mapService]);

  const acquireLocation = useCallback(async () => {
    setLocationState('LOADING');
    setLocationError(null);

    try {
      const locRes = await mapService.getCurrentLocation();
      if (locRes.ok) {
        setCurrentLocation(locRes.data);
        setLocationState('SUCCESS');
        return locRes.data;
      } else {
        setLocationState('UNAVAILABLE');
        setLocationError(locRes.error.message || 'Location fix currently unavailable');
      }
    } catch (err: any) {
      setLocationState('ERROR');
      setLocationError(err?.message || 'Error acquiring location permission or fix');
    }
  }, [mapService]);

  useEffect(() => {
    loadData();
    acquireLocation();

    // Subscribe to continuous location updates if available
    try {
      unobserveRef.current = mapService.observeLocation((event) => {
        if (event.type === 'LOCATION_UPDATED') {
          setCurrentLocation(event.location);
          setLocationState('SUCCESS');
        }
      });
    } catch (_e) {
      // Ignore fallback observation failure
    }

    return () => {
      if (unobserveRef.current) {
        unobserveRef.current();
      }
    };
  }, [loadData, acquireLocation, mapService]);

  const centerOnLocation = useCallback(async () => {
    const loc = await acquireLocation();
    const finalLoc = loc || currentLocation;
    if (finalLoc) {
      setSelectedMarker({ type: 'LOCATION', data: finalLoc });
    }
    return finalLoc || null;
  }, [acquireLocation, currentLocation]);

  const calculateRouteTo = useCallback(async (dest: LocationDto) => {
    if (!currentLocation) {
        Alert.alert("Error", "Current Location is missing. Cannot route.");
        return;
    }
    
    // Using OSRM Public API to trace real streets since offline graph data isn't bundled yet
    try {
      const url = `https://router.project-osrm.org/route/v1/walking/${currentLocation.longitude},${currentLocation.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;
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
  }, [currentLocation]);

  const clearRoute = useCallback(() => setActiveRoute(null), []);

  const selectMarker = useCallback((marker: SelectedMarker | null) => {
    setSelectedMarker(marker);
  }, []);

  return {
    mapLoadingState,
    offlineMapResult,
    locationState,
    currentLocation,
    locationError,
    incidents: filterIncidents ? incidents : [],
    resources: filterResources ? resources : [],
    hazards: filterHazards ? hazards : [],
    selectedMarker,
    mapError,
    refreshMap: loadData,
    centerOnLocation,
    selectMarker,
    filterIncidents,
    filterResources,
    filterHazards,
    setFilterIncidents,
    setFilterResources,
    setFilterHazards,
    activeRoute,
    calculateRouteTo,
    clearRoute,
  };
};
