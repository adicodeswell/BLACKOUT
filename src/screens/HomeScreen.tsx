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
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import { IncidentCard } from '../components/IncidentCard';
import { EmptyState } from '../components/EmptyState';
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
          setIncidents(incRes.data.slice(0, 2));
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

  const getNetworkVariant = () => {
    switch (networkStatus) {
      case 'ACTIVE':
        return 'active';
      case 'INITIALIZING':
        return 'warning';
      case 'STOPPED':
      case 'UNAVAILABLE':
      default:
        return 'danger';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
    >
      {/* 1. Header & Operational Branding */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <View style={styles.brandRow}>
          <View>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>BLACKOUT</Text>
            <Text style={[styles.brandSubtitle, { color: theme.colors.textSecondary }]}>
              OFFLINE MESH COMMAND CENTER
            </Text>
          </View>
          <View style={[styles.identityTag, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={{ color: theme.colors.networkActive, fontSize: 8, marginRight: 4 }}>●</Text>
            <Text style={[styles.identityText, { color: theme.colors.textPrimary }]}>self-node-01</Text>
          </View>
        </View>
      </View>

      {/* 2. Primary Emergency Action Hero CTA */}
      {onReportEmergency && (
        <View
          style={[
            styles.heroEmergencyCard,
            {
              backgroundColor: theme.colors.dangerBg,
              borderColor: theme.colors.primaryDanger,
            },
          ]}
        >
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroTitle, { color: theme.colors.dangerText }]}>🚨 IMMEDIATE EMERGENCY REPORT</Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.dangerText }]}>
              Broadcast an immediate offline SOS or local hazard alert to nearby mesh nodes.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.emergencyCtaBtn, { backgroundColor: theme.colors.primaryDanger }]}
            onPress={onReportEmergency}
            activeOpacity={0.85}
          >
            <Text style={styles.emergencyCtaText}>BROADCAST EMERGENCY SOS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Mesh Network Status Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeaderTitle, { color: theme.colors.textPrimary }]}>Mesh Radio Status</Text>
          <StatusPill
            label={networkStatus === 'ACTIVE' ? 'Active (Port 18888)' : networkStatus}
            variant={getNetworkVariant()}
          />
        </View>

        <View style={styles.networkMetricsRow}>
          <View style={[styles.metricBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Active Peers</Text>
            <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{peers.length}</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Transport Mode</Text>
            <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>TCP Direct</Text>
          </View>
        </View>

        {peers.length === 0 && (
          <Text style={[styles.networkHint, { color: theme.colors.textSecondary }]}>
            (No active P2P nodes connected in radio range. Retrying automated discovery...)
          </Text>
        )}
      </View>

      {/* 4. Active Emergency Incidents Summary */}
      <View style={styles.sectionMargin}>
        <SectionHeader
          title="Active Emergency Incidents"
          subtitle="Real-time aggregated local hazards"
          actionText={onNavigateToAlerts ? "View All Alerts →" : undefined}
          onAction={onNavigateToAlerts}
        />

        {incidents.length === 0 ? (
          <EmptyState
            icon="🚨"
            title="No Active Emergency Hazards"
            description="No high-severity incidents recorded on local mesh node."
          />
        ) : (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.incident_id}
              incident={incident}
              onPress={() => onNavigateToAlerts?.()}
            />
          ))
        )}
      </View>

      {/* 5. Command Center Shortcuts */}
      <View style={styles.sectionMargin}>
        <SectionHeader title="Command Center Shortcuts" subtitle="Fast access to operational views" />

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToMap}
            activeOpacity={0.7}
          >
            <Text style={styles.gridIcon}>🗺️</Text>
            <Text style={[styles.gridTitle, { color: theme.colors.textPrimary }]}>Hazard Map</Text>
            <Text style={[styles.gridSub, { color: theme.colors.textSecondary }]}>MBTiles & Pins</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToAlerts}
            activeOpacity={0.7}
          >
            <Text style={styles.gridIcon}>🚨</Text>
            <Text style={[styles.gridTitle, { color: theme.colors.textPrimary }]}>Alerts Directory</Text>
            <Text style={[styles.gridSub, { color: theme.colors.textSecondary }]}>Clustered Incidents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToResources}
            activeOpacity={0.7}
          >
            <Text style={styles.gridIcon}>📦</Text>
            <Text style={[styles.gridTitle, { color: theme.colors.textPrimary }]}>Resources</Text>
            <Text style={[styles.gridSub, { color: theme.colors.textSecondary }]}>Food & Shelters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            onPress={onNavigateToPeople}
            activeOpacity={0.7}
          >
            <Text style={styles.gridIcon}>👥</Text>
            <Text style={[styles.gridTitle, { color: theme.colors.textPrimary }]}>Mesh Messaging</Text>
            <Text style={[styles.gridSub, { color: theme.colors.textSecondary }]}>1-to-1 P2P Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. System Status Metrics Footer Bar */}
      <View style={[styles.footerMetrics, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <View style={styles.footerMetricItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Room SQLite:</Text>
          <Text style={[styles.footerValue, { color: theme.colors.confidenceConfirmed }]}>CONNECTED</Text>
        </View>

        <View style={styles.footerMetricItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Rule AI:</Text>
          <Text style={[styles.footerValue, { color: theme.colors.primary }]}>ACTIVE</Text>
        </View>

        <View style={styles.footerMetricItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Geo $A^*$:</Text>
          <Text style={[styles.footerValue, { color: theme.colors.warningText }]}>STANDBY</Text>
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
  },
  headerContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  identityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  identityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroEmergencyCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
  },
  heroTextContainer: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  emergencyCtaBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  networkMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  networkHint: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 10,
  },
  sectionMargin: {
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridSub: {
    fontSize: 11,
  },
  footerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  footerMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerValue: {
    fontSize: 11,
    fontWeight: '800',
  },
});
