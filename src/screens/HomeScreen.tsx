import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useServices } from '../services/ServiceContext';
import { NavIcon } from '../components/NavIcon';
import type { NetworkEngine } from '../contracts/network/NetworkEngine';
import type { IncidentService } from '../services/IncidentService';
import type { PeerDto } from '../contracts/network/PeerDto';
import type { IncidentDto } from '../contracts/data/IncidentDto';

interface HomeScreenProps {
  onReportEmergency?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToResources?: () => void;
  onNavigateToPeople?: () => void;
  networkEngine?: NetworkEngine;
  incidentService?: IncidentService;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onReportEmergency,
  onNavigateToMap,
  onNavigateToAlerts,
  onNavigateToResources,
  onNavigateToPeople,
  networkEngine: injectedNetworkEngine,
  incidentService: injectedIncidentService,
}) => {
  const { theme } = useTheme();
  const contextServices = useServices();

  const networkEngine = injectedNetworkEngine || contextServices.networkEngine;
  const incidentService = injectedIncidentService || contextServices.incidentService;

  const [networkStatus, setNetworkStatus] = useState<'INITIALIZING' | 'ACTIVE' | 'STOPPED' | 'UNAVAILABLE'>('INITIALIZING');
  const [peers, setPeers] = useState<PeerDto[]>([]);
  const [incidents, setIncidents] = useState<IncidentDto[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!networkEngine) {
      setNetworkStatus('UNAVAILABLE');
    } else {
      try {
        const startRes = await networkEngine.start();
        if (startRes.ok) {
          setNetworkStatus('ACTIVE');
        } else {
          setNetworkStatus('STOPPED');
        }

        const peersRes = await networkEngine.getPeers();
        if (peersRes.ok) {
          setPeers(peersRes.data);
        }
      } catch (_err) {
        setNetworkStatus('UNAVAILABLE');
      }
    }

    if (incidentService) {
      try {
        const incRes = await incidentService.listIncidents();
        if (incRes.ok) {
          setIncidents(incRes.data.slice(0, 3));
        }
      } catch (_err) {
        // Safe fallback
      }
    }
  }, [networkEngine, incidentService]);

  useEffect(() => {
    loadData();

    if (networkEngine) {
      const unsubscribe = networkEngine.subscribe((event) => {
        if (event.type === 'PEER_CONNECTED' || event.type === 'PEER_DISCONNECTED') {
          networkEngine.getPeers().then((res) => {
            if (res.ok) setPeers(res.data);
          });
        }
      });
      return () => unsubscribe();
    }
  }, [networkEngine, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = () => {
    switch (networkStatus) {
      case 'ACTIVE':
        return theme.colors.confidenceConfirmed;
      case 'INITIALIZING':
        return theme.colors.severityMedium;
      case 'STOPPED':
      case 'UNAVAILABLE':
      default:
        return theme.colors.severityCritical;
    }
  };

  const getSeverityColor = (severity: string) => {
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
        return theme.colors.textSecondary;
    }
  };

  const timeAgo = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
    >
      {/* 1. Compact Product Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>BLACKOUT</Text>
          <Text style={[styles.brandSub, { color: theme.colors.textSecondary }]}>OFFLINE EMERGENCY NETWORK</Text>
        </View>

        <View style={[styles.nodeTag, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.nodeTagText, { color: theme.colors.textSecondary }]}>NODE 01</Text>
          <View style={styles.nodeStatusRow}>
            <Text style={{ color: getStatusColor(), fontSize: 7, marginRight: 4 }}>●</Text>
            <Text style={[styles.nodeStatusText, { color: getStatusColor() }]}>{networkStatus}</Text>
          </View>
        </View>
      </View>

      {/* 2. Restrained Emergency Action Section */}
      {onReportEmergency && (
        <View style={[styles.emergencyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={styles.emergencyHeader}>
            <View style={[styles.emergencyIconCircle, { backgroundColor: `${theme.colors.primaryDanger}15` }]}>
              <NavIcon name="WARNING" size={16} color={theme.colors.primaryDanger} />
            </View>
            <View style={styles.emergencyTextStack}>
              <Text style={[styles.emergencyTitle, { color: theme.colors.textPrimary }]}>EMERGENCY ASSISTANCE</Text>
              <Text style={[styles.emergencySub, { color: theme.colors.textSecondary }]}>
                Broadcast an immediate offline SOS alert to nearby mesh nodes.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sosButton, { backgroundColor: theme.colors.primaryDanger }]}
            onPress={onReportEmergency}
            activeOpacity={0.85}
          >
            <NavIcon name="WARNING" size={16} color="#FFFFFF" />
            <Text style={styles.sosButtonText}>BROADCAST EMERGENCY SOS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Operational Mesh Status Section */}
      <View style={[styles.meshContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <View style={styles.meshHeaderRow}>
          <View style={styles.meshTitleGroup}>
            <NavIcon name="NETWORK" size={16} color={theme.colors.primary} />
            <Text style={[styles.meshTitle, { color: theme.colors.textPrimary }]}>LOCAL MESH</Text>
          </View>
          <View style={[styles.meshPill, { backgroundColor: `${getStatusColor()}15`, borderColor: `${getStatusColor()}40` }]}>
            <Text style={{ color: getStatusColor(), fontSize: 7, marginRight: 4 }}>●</Text>
            <Text style={[styles.meshPillText, { color: getStatusColor() }]}>{networkStatus}</Text>
          </View>
        </View>

        {peers.length === 0 ? (
          <View style={styles.emptyMeshBox}>
            <View style={[styles.centerNodeCircle, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary }]}>
              <Text style={{ color: theme.colors.primary, fontSize: 8 }}>●</Text>
            </View>
            <Text style={[styles.nodeStateTitle, { color: theme.colors.textPrimary }]}>THIS NODE</Text>
            <Text style={[styles.nodeStateCount, { color: theme.colors.textSecondary }]}>0 NEARBY NODES</Text>
            <Text style={[styles.nodeStateSub, { color: theme.colors.textSecondary }]}>
              Searching for nearby BLACKOUT emergency mesh nodes...
            </Text>
          </View>
        ) : (
          <View style={styles.activeMeshBox}>
            <View style={styles.activePeerRow}>
              <NavIcon name="CONNECTED" size={16} color={theme.colors.confidenceConfirmed} />
              <Text style={[styles.activePeerCount, { color: theme.colors.textPrimary }]}>
                {peers.length} {peers.length === 1 ? 'Peer Node Connected' : 'Peer Nodes Connected'}
              </Text>
            </View>
            <Text style={[styles.activeMeshHint, { color: theme.colors.textSecondary }]}>
              Local peer-to-peer radio socket actively forwarding emergency packets.
            </Text>
          </View>
        )}
      </View>

      {/* 4. Active Emergency Incidents List */}
      <View style={styles.sectionMargin}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>REAL-TIME HAZARDS</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Active Incidents</Text>
          </View>
          {onNavigateToAlerts && (
            <TouchableOpacity onPress={onNavigateToAlerts} activeOpacity={0.7} style={styles.viewAllBtn}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>

        {incidents.length === 0 ? (
          <View style={[styles.emptyIncidentBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <NavIcon name="CHECK" size={24} color={theme.colors.confidenceConfirmed} />
            <Text style={[styles.emptyIncidentTitle, { color: theme.colors.textPrimary }]}>No Active Emergency Hazards</Text>
            <Text style={[styles.emptyIncidentSub, { color: theme.colors.textSecondary }]}>
              No active high-severity incidents reported on local mesh node.
            </Text>
          </View>
        ) : (
          <View style={styles.incidentListStack}>
            {incidents.map((incident) => {
              const sevColor = getSeverityColor(incident.severity);
              return (
                <TouchableOpacity
                  key={incident.incident_id}
                  style={[
                    styles.incidentRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.surfaceBorder,
                      borderLeftColor: sevColor,
                    },
                  ]}
                  onPress={() => onNavigateToAlerts?.()}
                  activeOpacity={0.8}
                >
                  <View style={styles.incidentHeaderRow}>
                    <View style={[styles.severityTag, { backgroundColor: `${sevColor}18`, borderColor: sevColor }]}>
                      <Text style={[styles.severityTagText, { color: sevColor }]}>{incident.severity}</Text>
                    </View>
                    <Text style={[styles.incidentTime, { color: theme.colors.textSecondary }]}>
                      {timeAgo(incident.first_reported_at)}
                    </Text>
                  </View>

                  <Text style={[styles.incidentTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {incident.title}
                  </Text>
                  {incident.summary ? (
                    <Text style={[styles.incidentDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {incident.summary}
                    </Text>
                  ) : null}

                  <View style={[styles.incidentMetaRow, { borderTopColor: theme.colors.surfaceBorder }]}>
                    <View style={styles.metaLocation}>
                      <NavIcon name="LOCATION" size={12} color={theme.colors.textSecondary} />
                      <Text style={[styles.metaLocationText, { color: theme.colors.textSecondary }]}>
                        {incident.location
                          ? `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`
                          : 'Coordinates unavailable'}
                      </Text>
                    </View>

                    <Text style={[styles.metaSourceText, { color: theme.colors.textSecondary }]}>
                      {incident.confidence_level || 'UNVERIFIED'} · {incident.independent_source_count || 1} SOURCE
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 5. Operations Navigation Tiles */}
      <View style={styles.sectionMargin}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>NAVIGATION</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Operations Console</Text>
          </View>
        </View>

        <View style={styles.operationsGrid}>
          {/* Map Tile */}
          <TouchableOpacity
            style={[styles.opTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToMap}
            activeOpacity={0.7}
          >
            <View style={styles.opTopRow}>
              <NavIcon name="Map" size={20} color={theme.colors.primary} />
              <Text style={[styles.opTitle, { color: theme.colors.textPrimary }]}>Hazard Map</Text>
            </View>
            <Text style={[styles.opSub, { color: theme.colors.textSecondary }]}>
              {incidents.length} hazards recorded
            </Text>
          </TouchableOpacity>

          {/* Alerts Tile */}
          <TouchableOpacity
            style={[styles.opTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToAlerts}
            activeOpacity={0.7}
          >
            <View style={styles.opTopRow}>
              <NavIcon name="Alerts" size={20} color={theme.colors.primary} />
              <Text style={[styles.opTitle, { color: theme.colors.textPrimary }]}>Alerts Directory</Text>
            </View>
            <Text style={[styles.opSub, { color: theme.colors.textSecondary }]}>
              {incidents.length} active alerts
            </Text>
          </TouchableOpacity>

          {/* Resources Tile */}
          <TouchableOpacity
            style={[styles.opTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToResources}
            activeOpacity={0.7}
          >
            <View style={styles.opTopRow}>
              <NavIcon name="Resources" size={20} color={theme.colors.primary} />
              <Text style={[styles.opTitle, { color: theme.colors.textPrimary }]}>Resources</Text>
            </View>
            <Text style={[styles.opSub, { color: theme.colors.textSecondary }]}>
              Food & Shelters
            </Text>
          </TouchableOpacity>

          {/* Messages Tile */}
          <TouchableOpacity
            style={[styles.opTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToPeople}
            activeOpacity={0.7}
          >
            <View style={styles.opTopRow}>
              <NavIcon name="MESSAGE" size={20} color={theme.colors.primary} />
              <Text style={[styles.opTitle, { color: theme.colors.textPrimary }]}>Mesh Messaging</Text>
            </View>
            <Text style={[styles.opSub, { color: theme.colors.textSecondary }]}>
              Direct P2P Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  nodeTag: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  nodeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nodeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  nodeStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emergencyContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emergencyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emergencyTextStack: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  emergencySub: {
    fontSize: 12,
    lineHeight: 16,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  meshContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  meshHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  meshTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meshTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  meshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  meshPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyMeshBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  centerNodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nodeStateTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nodeStateCount: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  nodeStateSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeMeshBox: {
    paddingVertical: 8,
  },
  activePeerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activePeerCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeMeshHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionMargin: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyIncidentBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIncidentTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyIncidentSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  incidentListStack: {
    gap: 10,
  },
  incidentRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  incidentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  severityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  severityTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  incidentTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  incidentDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  incidentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLocationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaSourceText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  opTile: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
    justifyContent: 'center',
  },
  opTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  opTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  opSub: {
    fontSize: 11,
  },
});
