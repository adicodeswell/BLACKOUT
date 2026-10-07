import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useIncidents } from '../hooks/useIncidents';
import { IncidentCard } from '../components/IncidentCard';
import type { IncidentService } from '../services/IncidentService';

interface AlertsScreenProps {
  incidentService: IncidentService;
  onSelectIncident: (incidentId: string) => void;
}

const CATEGORY_FILTERS = [
  { label: 'All Incidents', value: undefined },
  { label: '🔥 Fire', value: 'FIRE' },
  { label: '🌊 Flood', value: 'FLOOD' },
  { label: '🚑 Medical', value: 'MEDICAL' },
  { label: '🚧 Blocked Road', value: 'BLOCKED_ROAD' },
  { label: '💧 Water / Supply', value: 'WATER' },
];

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  incidentService,
  onSelectIncident,
}) => {
  const { theme } = useTheme();
  const {
    incidents,
    isLoading,
    error,
    refresh,
    filterCategory,
    setFilterCategory,
  } = useIncidents(incidentService);

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const activeCount = incidents.filter((i) => i.status === 'OPEN' || i.status === 'MONITORING').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Emergency Header Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Incident Ledger</Text>
          <View style={[styles.liveBadge, { backgroundColor: theme.colors.severityCritical + '20', borderColor: theme.colors.severityCritical }]}>
            <View style={[styles.liveDot, { backgroundColor: theme.colors.severityCritical }]} />
            <Text style={[styles.liveBadgeText, { color: theme.colors.severityCritical }]}>MESH ACTIVE</Text>
          </View>
        </View>

        {/* Dynamic Summary Metrics Bar */}
        <View style={[styles.statsBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: criticalCount > 0 ? theme.colors.severityCritical : theme.colors.textPrimary }]}>
              {criticalCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Critical</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{incidents.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Tracked</Text>
          </View>
        </View>
      </View>

      {/* Filter Category Chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = filterCategory === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                  },
                ]}
                onPress={() => setFilterCategory(item.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.filterListContent}
        />
      </View>

      {/* Main Content States */}
      {isLoading && incidents.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>Syncing Incident Ledger...</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            Querying local-first database and neighbor mesh nodes.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.dangerBg }]}>
            <Text style={styles.iconCircleText}>⚠️</Text>
          </View>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>Unable to Load Incidents</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            {error.message || 'An error occurred while fetching incident data.'}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={refresh}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Retry Local Sync</Text>
          </TouchableOpacity>
        </View>
      ) : incidents.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceBorder }]}>
            <Text style={styles.iconCircleText}>🛡️</Text>
          </View>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>No Incidents Flagged</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            {filterCategory
              ? `No active emergency incidents matching filter "${filterCategory}".`
              : 'Your local ledger reports no active emergency incidents in range.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.incident_id}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() => onSelectIncident(item.incident_id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  filterRow: {
    marginBottom: 14,
    height: 38,
  },
  filterListContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircleText: {
    fontSize: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  stateSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});


