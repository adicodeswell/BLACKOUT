import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { MapService } from '../services/MapService';
import { DevGeoEngine } from '../adapters/geo/DevGeoEngine';
import { DevDataEngine } from '../adapters/data/DevDataEngine';
import { useMap } from '../hooks/useMap';
import { NavIcon } from '../components/NavIcon';





// MapLibre React Native
import { Map as MapView, Camera, Marker } from '@maplibre/maplibre-react-native';

interface MapScreenProps {
  mapService?: MapService;
  onSelectIncident?: (incidentId: string) => void;
  onSelectResource?: (resourceId: string) => void;
}

// Production MapLibre Style Specifications for Dark & Light modes
const DARK_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Dark Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© MapLibre © OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0F131C',
      },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'demotiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.75,
        'raster-brightness-max': 0.55,
        'raster-contrast': 0.25,
        'raster-saturation': -0.5,
      },
    },
  ],
};

const LIGHT_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Light Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© MapLibre © OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#F4F6F9',
      },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'demotiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.9,
        'raster-contrast': 0.1,
        'raster-saturation': -0.2,
      },
    },
  ],
};

export const MapScreen: React.FC<MapScreenProps> = ({
  mapService: injectedMapService,
  onSelectIncident,
  onSelectResource,
}) => {
  const { theme } = useTheme();

  // Lazy fallback service initialization if not injected
  const mapService = useMemo(() => {
    if (injectedMapService) return injectedMapService;
    const devGeo = new DevGeoEngine();
    const devData = new DevDataEngine();
    return new MapService(devGeo, devData);
  }, [injectedMapService]);

  const {
    mapLoadingState,
    offlineMapResult,
    locationState,
    currentLocation,
    locationError,
    incidents,
    resources,
    hazards,
    selectedMarker,
    mapError,
    refreshMap,
    centerOnLocation,
    selectMarker,
    filterIncidents,
    filterResources,
    filterHazards,
    setFilterIncidents,
    setFilterResources,
    setFilterHazards,
  } = useMap(mapService);

  // Camera state for MapLibre
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>([-122.4194, 37.7749]);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Update center when location is acquired
  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      setCenterCoordinate([currentLocation.longitude, currentLocation.latitude]);
    }
  }, [currentLocation]);

  const handleRecenter = useCallback(async () => {
    await centerOnLocation();
    if (currentLocation?.latitude && currentLocation?.longitude) {
      setCenterCoordinate([currentLocation.longitude, currentLocation.latitude]);
      setZoomLevel(14);
    }
  }, [centerOnLocation, currentLocation]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 1, 18));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 1, 8));
  }, []);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return theme.colors.severityCritical;
      case 'HIGH':
        return theme.colors.severityHigh;
      case 'MEDIUM':
        return theme.colors.severityMedium;
      case 'LOW':
        return theme.colors.severityLow;
      default:
        return theme.colors.severityUnknown;
    }
  };

  const getAvailabilityColor = (avail?: string) => {
    switch (avail) {
      case 'AVAILABLE':
        return theme.colors.confidenceConfirmed;
      case 'LIMITED':
        return theme.colors.severityMedium;
      case 'FULL':
      case 'CLOSED':
        return theme.colors.severityCritical;
      default:
        return theme.colors.textSecondary;
    }
  };

  const currentMapStyle = theme.mode === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Floating Operational Header */}
      <View
        style={[
          styles.floatingHeader,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <View style={styles.brandTitleGroup}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              BLACKOUT MAP
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Local emergency intelligence
            </Text>
          </View>
          <View
            style={[
              styles.offlineBadge,
              {
                backgroundColor: offlineMapResult?.available ? theme.colors.infoBg : theme.colors.warningBg,
                borderColor: offlineMapResult?.available ? theme.colors.infoBorder : theme.colors.warningBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.offlineBadgeDot,
                { color: offlineMapResult?.available ? theme.colors.confidenceConfirmed : theme.colors.warningText },
              ]}
            >
              ●
            </Text>
            <Text
              style={[
                styles.offlineBadgeText,
                { color: offlineMapResult?.available ? theme.colors.infoText : theme.colors.warningText },
              ]}
            >
              {offlineMapResult?.available ? 'OFFLINE READY' : 'LOCAL GEO ENGINE'}
            </Text>
          </View>
        </View>

        {/* Filter Toggle Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterIncidents
                ? { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.primaryDanger }
                : { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder },
            ]}
            onPress={() => setFilterIncidents(!filterIncidents)}
            activeOpacity={0.7}
          >
            <NavIcon
              name="Alerts"
              color={filterIncidents ? theme.colors.primaryDanger : theme.colors.textSecondary}
              size={14}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterIncidents ? theme.colors.dangerText : theme.colors.textSecondary },
              ]}
            >
              INCIDENTS ({incidents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterResources
                ? { backgroundColor: theme.colors.infoBg, borderColor: theme.colors.accent }
                : { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder },
            ]}
            onPress={() => setFilterResources(!filterResources)}
            activeOpacity={0.7}
          >
            <NavIcon
              name="Resources"
              color={filterResources ? theme.colors.accent : theme.colors.textSecondary}
              size={14}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterResources ? theme.colors.infoText : theme.colors.textSecondary },
              ]}
            >
              RESOURCES ({resources.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterHazards
                ? { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder }
                : { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder },
            ]}
            onPress={() => setFilterHazards(!filterHazards)}
            activeOpacity={0.7}
          >
            <NavIcon
              name="WARNING"
              color={filterHazards ? theme.colors.warningText : theme.colors.textSecondary}
              size={14}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterHazards ? theme.colors.warningText : theme.colors.textSecondary },
              ]}
            >
              HAZARDS ({hazards.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Error / Status Banner if unavailable */}
        {locationState === 'UNAVAILABLE' || locationError ? (
          <View
            style={[
              styles.locationBanner,
              { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder },
            ]}
          >
            <NavIcon name="LOCATION" color={theme.colors.warningText} size={14} />
            <Text style={[styles.locationBannerText, { color: theme.colors.warningText }]}>
              LOCATION UNAVAILABLE • Viewing offline incident & resource layer
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. Real MapLibre Surface */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.mapView}
          mapStyle={currentMapStyle}
          attribution={false}
          logo={false}
          compass={false}
          scaleBar={false}
          onPress={() => selectMarker(null)}
        >
          <Camera
            center={centerCoordinate}
            zoom={zoomLevel}
            duration={400}
          />

          {/* Incident Markers */}
          {incidents.map((inc) => {
            if (!inc.location?.latitude || !inc.location?.longitude) return null;
            const isSelected =
              selectedMarker?.type === 'INCIDENT' && selectedMarker.data.incident_id === inc.incident_id;
            const sevColor = getSeverityColor(inc.severity);

            return (
              <Marker
                key={`inc-${inc.incident_id}`}
                id={`inc-${inc.incident_id}`}
                lngLat={[inc.location.longitude, inc.location.latitude]}
                onPress={() => selectMarker({ type: 'INCIDENT', data: inc })}
              >
                <View style={styles.markerAnchor}>
                  <View
                    style={[
                      styles.incidentMarker,
                      { backgroundColor: sevColor, borderColor: '#FFFFFF' },
                      isSelected && [styles.selectedMarkerHalo, { borderColor: sevColor }],
                    ]}
                  >
                    <NavIcon name="Alerts" color="#FFFFFF" size={14} />
                  </View>
                </View>
              </Marker>
            );
          })}

          {/* Resource Markers */}
          {resources.map((res) => {
            if (!res.location?.latitude || !res.location?.longitude) return null;
            const isSelected =
              selectedMarker?.type === 'RESOURCE' && selectedMarker.data.resource_id === res.resource_id;

            return (
              <Marker
                key={`res-${res.resource_id}`}
                id={`res-${res.resource_id}`}
                lngLat={[res.location.longitude, res.location.latitude]}
                onPress={() => selectMarker({ type: 'RESOURCE', data: res })}
              >
                <View style={styles.markerAnchor}>
                  <View
                    style={[
                      styles.resourceMarker,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent },
                      isSelected && [styles.selectedMarkerHalo, { borderColor: theme.colors.accent }],
                    ]}
                  >
                    <NavIcon name="Resources" color={theme.colors.accent} size={13} />
                  </View>
                </View>
              </Marker>
            );
          })}

          {/* Hazard Markers */}
          {hazards.map((haz) => {
            const geom = haz.geometry as { latitude: number; longitude: number };
            if (!geom?.latitude || !geom?.longitude) return null;
            const isSelected =
              selectedMarker?.type === 'HAZARD' && selectedMarker.data.hazard_id === haz.hazard_id;

            return (
              <Marker
                key={`haz-${haz.hazard_id}`}
                id={`haz-${haz.hazard_id}`}
                lngLat={[geom.longitude, geom.latitude]}
                onPress={() => selectMarker({ type: 'HAZARD', data: haz })}
              >
                <View style={styles.markerAnchor}>
                  <View
                    style={[
                      styles.hazardMarker,
                      { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningText },
                      isSelected && [styles.selectedMarkerHalo, { borderColor: theme.colors.warningText }],
                    ]}
                  >
                    <NavIcon name="WARNING" color={theme.colors.warningText} size={13} />
                  </View>
                </View>
              </Marker>
            );
          })}

          {/* Current Location Marker */}
          {currentLocation?.latitude && currentLocation?.longitude ? (
            <Marker
              key="current-location"
              id="current-location"
              lngLat={[currentLocation.longitude, currentLocation.latitude]}
              onPress={() => selectMarker({ type: 'LOCATION', data: currentLocation })}
            >
              <View style={styles.markerAnchor}>
                <View style={[styles.locationRing, { borderColor: theme.colors.primary }]}>
                  <View style={[styles.locationDot, { backgroundColor: theme.colors.primary }]} />
                </View>
              </View>
            </Marker>
          ) : null}
        </MapView>

        {/* Loading Overlay */}
        {mapLoadingState === 'LOADING' ? (
          <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(15, 19, 28, 0.45)' }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: '#FFFFFF' }]}>
              Initializing offline map engine...
            </Text>
          </View>
        ) : null}

        {/* Map Error Banner */}
        {mapError ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerBg }]}>
            <Text style={[styles.errorText, { color: theme.colors.dangerText }]}>{mapError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshMap}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* 3. Floating Collapsible Legend */}
      {showLegend ? (
        <View
          style={[
            styles.floatingLegend,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.legendHeader}>
            <Text style={[styles.legendTitle, { color: theme.colors.textSecondary }]}>
              MAP OVERLAY LEGEND
            </Text>
            <TouchableOpacity onPress={() => setShowLegend(false)} style={styles.legendClose}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.severityCritical }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              Critical / High Incident
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              Emergency Resource Point
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.warningText }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              Active Road / Hazard Area
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              Your GNSS Location Fix
            </Text>
          </View>
        </View>
      ) : null}

      {/* 4. Floating Map Control Buttons */}
      <View style={[styles.controlsContainer, selectedMarker ? { bottom: 270 } : { bottom: 24 }]}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
          ]}
          onPress={handleZoomIn}
          activeOpacity={0.7}
          accessibilityLabel="Zoom In"
        >
          <NavIcon name="PLUS" color={theme.colors.textPrimary} size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              marginTop: 8,
            },
          ]}
          onPress={handleZoomOut}
          activeOpacity={0.7}
          accessibilityLabel="Zoom Out"
        >
          <View style={{ width: 12, height: 2, backgroundColor: theme.colors.textPrimary }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              marginTop: 8,
            },
          ]}
          onPress={handleRecenter}
          activeOpacity={0.7}
          accessibilityLabel="My Location"
        >
          <NavIcon name="LOCATION" color={theme.colors.primary} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              marginTop: 8,
            },
          ]}
          onPress={() => setShowLegend(!showLegend)}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Legend"
        >
          <NavIcon name="INFO" color={showLegend ? theme.colors.primary : theme.colors.textSecondary} size={16} />
        </TouchableOpacity>
      </View>

      {/* 5. Selected Marker Detail Bottom Sheet */}
      {selectedMarker ? (
        <View
          style={[
            styles.bottomSheet,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.surfaceBorder },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleGroup}>
              <Text style={[styles.sheetPreTitle, { color: theme.colors.textSecondary }]}>
                {selectedMarker.type} DETAILS
              </Text>
              <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {selectedMarker.type === 'INCIDENT' && selectedMarker.data.title}
                {selectedMarker.type === 'RESOURCE' && selectedMarker.data.name}
                {selectedMarker.type === 'HAZARD' && `HAZARD: ${selectedMarker.data.type}`}
                {selectedMarker.type === 'LOCATION' && 'CURRENT GNSS LOCATION'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => selectMarker(null)}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {/* INCIDENT DETAILS */}
            {selectedMarker.type === 'INCIDENT' && (
              <View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getSeverityColor(selectedMarker.data.severity) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{selectedMarker.data.severity}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.surfaceBorder }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.textPrimary }]}>
                      {selectedMarker.data.status}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.infoBg }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.infoText }]}>
                      CONFIDENCE: {selectedMarker.data.confidence_level}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                  {selectedMarker.data.summary}
                </Text>

                {selectedMarker.data.location ? (
                  <View style={styles.metaRow}>
                    <NavIcon name="LOCATION" color={theme.colors.textSecondary} size={12} />
                    <Text style={[styles.coordsText, { color: theme.colors.textSecondary }]}>
                      {selectedMarker.data.location.latitude.toFixed(4)},{' '}
                      {selectedMarker.data.location.longitude.toFixed(4)} (±
                      {selectedMarker.data.location.accuracy_m}m)
                    </Text>
                  </View>
                ) : null}

                {onSelectIncident && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onSelectIncident(selectedMarker.data.incident_id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>VIEW INCIDENT →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* RESOURCE DETAILS */}
            {selectedMarker.type === 'RESOURCE' && (
              <View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getAvailabilityColor(selectedMarker.data.availability) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{selectedMarker.data.availability}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.infoBg }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.infoText }]}>
                      TYPE: {selectedMarker.data.type}
                    </Text>
                  </View>
                </View>

                {selectedMarker.data.description ? (
                  <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                    {selectedMarker.data.description}
                  </Text>
                ) : null}

                {selectedMarker.data.remaining_capacity !== undefined ? (
                  <Text
                    style={[
                      styles.capacityText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Remaining Capacity: {selectedMarker.data.remaining_capacity} /{' '}
                    {selectedMarker.data.capacity ?? '∞'} units
                  </Text>
                ) : null}

                {selectedMarker.data.location ? (
                  <View style={styles.metaRow}>
                    <NavIcon name="LOCATION" color={theme.colors.textSecondary} size={12} />
                    <Text style={[styles.coordsText, { color: theme.colors.textSecondary }]}>
                      {selectedMarker.data.location.latitude.toFixed(4)},{' '}
                      {selectedMarker.data.location.longitude.toFixed(4)}
                    </Text>
                  </View>
                ) : null}

                {onSelectResource && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onSelectResource(selectedMarker.data.resource_id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>VIEW RESOURCE →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* HAZARD DETAILS */}
            {selectedMarker.type === 'HAZARD' && (
              <View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getSeverityColor(selectedMarker.data.severity) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{selectedMarker.data.severity}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.surfaceBorder }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.textPrimary }]}>
                      STATUS: {selectedMarker.data.status}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                  Active hazard flagged in offline road graph network. Exercise caution around geometry
                  perimeter.
                </Text>

                {selectedMarker.data.source_incident_id && onSelectIncident ? (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.colors.surfaceBorder }]}
                    onPress={() => onSelectIncident(selectedMarker.data.source_incident_id!)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                      VIEW LINKED INCIDENT #{selectedMarker.data.source_incident_id} →
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* LOCATION DETAILS */}
            {selectedMarker.type === 'LOCATION' && (
              <View>
                <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                  Local GNSS position fix acquired.
                </Text>
                <View style={styles.metaRow}>
                  <NavIcon name="LOCATION" color={theme.colors.primary} size={14} />
                  <Text style={[styles.coordsText, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                    Lat: {selectedMarker.data.latitude.toFixed(5)}, Lon:{' '}
                    {selectedMarker.data.longitude.toFixed(5)}
                  </Text>
                </View>
                <Text style={[styles.coordsText, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                  Accuracy Radius: ±{selectedMarker.data.accuracy_m} meters
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineBadgeDot: {
    fontSize: 8,
    marginRight: 4,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    gap: 4,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  locationBanner: {
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationBannerText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  mapView: {
    flex: 1,
  },
  markerAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  resourceMarker: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  hazardMarker: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  selectedMarkerHalo: {
    borderWidth: 3,
    transform: [{ scale: 1.25 }],
  },
  locationRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 110, 253, 0.25)',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  floatingLegend: {
    position: 'absolute',
    left: 12,
    bottom: 120,
    zIndex: 20,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 180,
    elevation: 5,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  legendTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legendClose: {
    padding: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlsContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 20,
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    maxHeight: 280,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitleGroup: {
    flex: 1,
  },
  sheetPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetContent: {
    maxHeight: 180,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sheetSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  coordsText: {
    fontSize: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 44,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 44,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
