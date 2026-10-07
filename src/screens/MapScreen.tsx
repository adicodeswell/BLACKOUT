import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { MapService, DEFAULT_BAY_AREA_REGION } from '../services/MapService';
import { DevGeoEngine } from '../adapters/geo/DevGeoEngine';
import { DevDataEngine } from '../adapters/data/DevDataEngine';
import { useMap, SelectedMarker } from '../hooks/useMap';
import type { IncidentDto } from '../contracts/data/IncidentDto';
import type { ResourceDto } from '../contracts/data/ResourceDto';
import type { HazardDto } from '../contracts/geo/HazardDto';
import type { LocationDto } from '../contracts/geo/LocationDto';

interface MapScreenProps {
  mapService?: MapService;
  onSelectIncident?: (incidentId: string) => void;
  onSelectResource?: (resourceId: string) => void;
}

const REGION = {
  minLat: 37.750,
  maxLat: 37.795,
  minLon: -122.455,
  maxLon: -122.400,
};

/**
 * Maps lat/lon to percentage position (0% - 100%) on the map surface
 */
const getCanvasPosition = (lat: number, lon: number) => {
  const latSpan = REGION.maxLat - REGION.minLat;
  const lonSpan = REGION.maxLon - REGION.minLon;

  // Invert latitude because SVG/screen Y goes downwards
  const topPercent = Math.max(5, Math.min(95, ((REGION.maxLat - lat) / latSpan) * 100));
  const leftPercent = Math.max(5, Math.min(95, ((lon - REGION.minLon) / lonSpan) * 100));

  return { topPercent, leftPercent };
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

  const renderMarkerIcon = (marker: SelectedMarker) => {
    switch (marker.type) {
      case 'INCIDENT':
        return '🚨';
      case 'RESOURCE':
        return '📦';
      case 'HAZARD':
        return '⚠️';
      case 'LOCATION':
        return '◎';
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header & Offline Map Banner */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Offline Map</Text>
          <View style={[styles.offlineBadge, { backgroundColor: theme.colors.infoBg, borderColor: theme.colors.infoBorder }]}>
            <Text style={[styles.offlineBadgeDot, { color: theme.colors.confidenceConfirmed }]}>●</Text>
            <Text style={[styles.offlineBadgeText, { color: theme.colors.infoText }]}>
              {offlineMapResult?.available ? 'Offline Ready (Local Cache)' : 'Offline Map Active'}
            </Text>
          </View>
        </View>

        {/* Filter Toggle Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterIncidents && { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.primaryDanger },
            ]}
            onPress={() => setFilterIncidents(!filterIncidents)}
          >
            <Text style={[styles.filterChipText, { color: filterIncidents ? theme.colors.dangerText : theme.colors.textSecondary }]}>
              🚨 Incidents ({incidents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterResources && { backgroundColor: theme.colors.infoBg, borderColor: theme.colors.accent },
            ]}
            onPress={() => setFilterResources(!filterResources)}
          >
            <Text style={[styles.filterChipText, { color: filterResources ? theme.colors.infoText : theme.colors.textSecondary }]}>
              📦 Resources ({resources.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterHazards && { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder },
            ]}
            onPress={() => setFilterHazards(!filterHazards)}
          >
            <Text style={[styles.filterChipText, { color: filterHazards ? theme.colors.warningText : theme.colors.textSecondary }]}>
              ⚠️ Hazards ({hazards.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Status Message if unavailable */}
        {locationState === 'UNAVAILABLE' || locationError ? (
          <View style={[styles.locationBanner, { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder }]}>
            <Text style={[styles.locationBannerText, { color: theme.colors.warningText }]}>
              ⚠️ Location unavailable. You can still browse nearby incident, resource and hazard data.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Main Map View Surface */}
      <View style={styles.mapCanvasContainer}>
        {/* Background Grid & Topology Texture */}
        <View style={[styles.mapCanvas, { backgroundColor: theme.mode === 'dark' ? '#12161F' : '#EBF0F5', borderColor: theme.colors.surfaceBorder }]}>
          {/* Decorative Grid Lines */}
          <View style={styles.gridLineHorizontal1} />
          <View style={styles.gridLineHorizontal2} />
          <View style={styles.gridLineVertical1} />
          <View style={styles.gridLineVertical2} />

          {/* Compass / Scale Overlay */}
          <View style={[styles.scaleOverlay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.scaleText, { color: theme.colors.textSecondary }]}>
              DEV MAP SURFACE • N 37.77° W 122.41°
            </Text>
          </View>

          {/* Map Legend Overlay */}
          <View style={[styles.legendOverlay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.legendTitle, { color: theme.colors.textSecondary }]}>Legend</Text>
            <View style={styles.legendItem}>
              <Text style={{ color: theme.colors.severityCritical }}>●</Text>
              <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}> Incident</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={{ color: theme.colors.accent }}>◆</Text>
              <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}> Resource</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={{ color: theme.colors.warningText }}>▲</Text>
              <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}> Hazard</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={{ color: theme.colors.primary }}>◎</Text>
              <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}> Location</Text>
            </View>
          </View>

          {/* Render Hazards */}
          {hazards.map((haz) => {
            const geom = haz.geometry as { latitude: number; longitude: number };
            if (!geom?.latitude || !geom?.longitude) return null;
            const pos = getCanvasPosition(geom.latitude, geom.longitude);
            const isSelected = selectedMarker?.type === 'HAZARD' && selectedMarker.data.hazard_id === haz.hazard_id;

            return (
              <TouchableOpacity
                key={haz.hazard_id}
                style={[
                  styles.markerTouch,
                  { top: `${pos.topPercent}%` as any, left: `${pos.leftPercent}%` as any },
                ]}
                onPress={() => selectMarker({ type: 'HAZARD', data: haz })}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.hazardMarker,
                    { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder },
                    isSelected && [styles.selectedMarkerHalo, { borderColor: theme.colors.warningText }],
                  ]}
                >
                  <Text style={styles.markerText}>▲</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Render Resources */}
          {resources.map((res) => {
            if (!res.location) return null;
            const pos = getCanvasPosition(res.location.latitude, res.location.longitude);
            const isSelected = selectedMarker?.type === 'RESOURCE' && selectedMarker.data.resource_id === res.resource_id;

            return (
              <TouchableOpacity
                key={res.resource_id}
                style={[
                  styles.markerTouch,
                  { top: `${pos.topPercent}%` as any, left: `${pos.leftPercent}%` as any },
                ]}
                onPress={() => selectMarker({ type: 'RESOURCE', data: res })}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.resourceMarker,
                    { backgroundColor: theme.colors.infoBg, borderColor: theme.colors.accent },
                    isSelected && [styles.selectedMarkerHalo, { borderColor: theme.colors.accent }],
                  ]}
                >
                  <Text style={styles.markerText}>◆</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Render Incidents */}
          {incidents.map((inc) => {
            if (!inc.location) return null;
            const pos = getCanvasPosition(inc.location.latitude, inc.location.longitude);
            const isSelected = selectedMarker?.type === 'INCIDENT' && selectedMarker.data.incident_id === inc.incident_id;
            const sevColor = getSeverityColor(inc.severity);

            return (
              <TouchableOpacity
                key={inc.incident_id}
                style={[
                  styles.markerTouch,
                  { top: `${pos.topPercent}%` as any, left: `${pos.leftPercent}%` as any },
                ]}
                onPress={() => selectMarker({ type: 'INCIDENT', data: inc })}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.incidentMarker,
                    { backgroundColor: sevColor, borderColor: '#FFFFFF' },
                    isSelected && [styles.selectedMarkerHalo, { borderColor: sevColor }],
                  ]}
                >
                  <Text style={styles.incidentMarkerText}>🚨</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Render Current Location Marker */}
          {currentLocation ? (() => {
            const pos = getCanvasPosition(currentLocation.latitude, currentLocation.longitude);
            const isSelected = selectedMarker?.type === 'LOCATION';
            return (
              <TouchableOpacity
                style={[
                  styles.markerTouch,
                  { top: `${pos.topPercent}%` as any, left: `${pos.leftPercent}%` as any },
                ]}
                onPress={() => selectMarker({ type: 'LOCATION', data: currentLocation })}
                activeOpacity={0.8}
              >
                <View style={[styles.locationPulse, { borderColor: theme.colors.primary }]}>
                  <View style={[styles.locationDot, { backgroundColor: theme.colors.primary }]} />
                </View>
              </TouchableOpacity>
            );
          })() : null}

          {/* Loading Indicator */}
          {mapLoadingState === 'LOADING' ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading offline map data...
              </Text>
            </View>
          ) : null}

          {/* Error Message */}
          {mapError ? (
            <View style={[styles.errorOverlay, { backgroundColor: theme.colors.dangerBg }]}>
              <Text style={[styles.errorText, { color: theme.colors.dangerText }]}>{mapError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshMap}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Map Surface Controls (Center Location + Refresh) */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
              onPress={centerOnLocation}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18, color: theme.colors.textPrimary }}>◎</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, marginTop: 8 }]}
              onPress={refreshMap}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Selected Marker Detail Bottom Sheet */}
      {selectedMarker ? (
        <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.surfaceBorder }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderTitleRow}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>{renderMarkerIcon(selectedMarker)}</Text>
              <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {selectedMarker.type === 'INCIDENT' && selectedMarker.data.title}
                {selectedMarker.type === 'RESOURCE' && selectedMarker.data.name}
                {selectedMarker.type === 'HAZARD' && `Hazard: ${selectedMarker.data.type}`}
                {selectedMarker.type === 'LOCATION' && 'Current Location'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => selectMarker(null)} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {/* INCIDENT DETAILS */}
            {selectedMarker.type === 'INCIDENT' && (
              <View>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: getSeverityColor(selectedMarker.data.severity) }]}>
                    <Text style={styles.badgeText}>{selectedMarker.data.severity}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.surfaceBorder }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.textPrimary }]}>{selectedMarker.data.status}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.infoBg }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.infoText }]}>{selectedMarker.data.confidence_level}</Text>
                  </View>
                </View>

                <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                  {selectedMarker.data.summary}
                </Text>

                {selectedMarker.data.location ? (
                  <Text style={[styles.coordsText, { color: theme.colors.textSecondary }]}>
                    📍 {selectedMarker.data.location.latitude.toFixed(4)}, {selectedMarker.data.location.longitude.toFixed(4)} (±{selectedMarker.data.location.accuracy_m}m)
                  </Text>
                ) : null}

                {onSelectIncident && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onSelectIncident(selectedMarker.data.incident_id)}
                  >
                    <Text style={styles.actionButtonText}>View Full Incident Details →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* RESOURCE DETAILS */}
            {selectedMarker.type === 'RESOURCE' && (
              <View>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: getAvailabilityColor(selectedMarker.data.availability) }]}>
                    <Text style={styles.badgeText}>{selectedMarker.data.availability}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.infoBg }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.infoText }]}>{selectedMarker.data.type}</Text>
                  </View>
                </View>

                {selectedMarker.data.description ? (
                  <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                    {selectedMarker.data.description}
                  </Text>
                ) : null}

                {selectedMarker.data.remaining_capacity !== undefined ? (
                  <Text style={[styles.coordsText, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                    Capacity: {selectedMarker.data.remaining_capacity} / {selectedMarker.data.capacity ?? '∞'} remaining
                  </Text>
                ) : null}

                {selectedMarker.data.location ? (
                  <Text style={[styles.coordsText, { color: theme.colors.textSecondary }]}>
                    📍 {selectedMarker.data.location.latitude.toFixed(4)}, {selectedMarker.data.location.longitude.toFixed(4)}
                  </Text>
                ) : null}

                {onSelectResource && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onSelectResource(selectedMarker.data.resource_id)}
                  >
                    <Text style={styles.actionButtonText}>View Resource Details →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* HAZARD DETAILS */}
            {selectedMarker.type === 'HAZARD' && (
              <View>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: getSeverityColor(selectedMarker.data.severity) }]}>
                    <Text style={styles.badgeText}>{selectedMarker.data.severity}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.surfaceBorder }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.textPrimary }]}>{selectedMarker.data.status}</Text>
                  </View>
                </View>

                <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                  Active hazard flagged in offline road graph network. Exercise caution around geometry perimeter.
                </Text>

                {selectedMarker.data.source_incident_id && onSelectIncident ? (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.colors.surfaceBorder }]}
                    onPress={() => onSelectIncident(selectedMarker.data.source_incident_id!)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                      View Linked Incident #{selectedMarker.data.source_incident_id} →
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* LOCATION DETAILS */}
            {selectedMarker.type === 'LOCATION' && (
              <View>
                <Text style={[styles.sheetSummary, { color: theme.colors.textSecondary }]}>
                  GNSS offline position lock fix acquired.
                </Text>
                <Text style={[styles.coordsText, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  Lat: {selectedMarker.data.latitude.toFixed(5)}, Lon: {selectedMarker.data.longitude.toFixed(5)}
                </Text>
                <Text style={[styles.coordsText, { color: theme.colors.textSecondary }]}>
                  Estimated Accuracy: ±{selectedMarker.data.accuracy_m} meters
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
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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
    fontSize: 10,
    marginRight: 4,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationBanner: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationBannerText: {
    fontSize: 12,
  },
  mapCanvasContainer: {
    flex: 1,
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLineHorizontal1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridLineVertical1: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridLineVertical2: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scaleOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  scaleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legendOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  markerTouch: {
    position: 'absolute',
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  incidentMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  incidentMarkerText: {
    fontSize: 14,
  },
  resourceMarker: {
    width: 26,
    height: 26,
    borderRadius: 6,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  hazardMarker: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  markerText: {
    fontSize: 12,
    transform: [{ rotate: '-45deg' }],
  },
  selectedMarkerHalo: {
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  locationPulse: {
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
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 6,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 280,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sheetContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  coordsText: {
    fontSize: 12,
    marginBottom: 6,
  },
  actionButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
