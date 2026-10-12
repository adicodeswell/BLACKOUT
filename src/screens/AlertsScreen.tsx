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
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SectionHeader } from '../components/SectionHeader';
import type { IncidentService } from '../services/IncidentService';

interface AlertsScreenProps {
  incidentService: IncidentService;
  onSelectIncident: (incidentId: string) => void;
}

const CATEGORY_FILTERS = [
  { label: 'All Incidents', value: undefined },
  { label: 'Fire', value: 'FIRE' },
  { label: 'Flood', value: 'FLOOD' },
  { label: 'Medical', value: 'MEDICAL' },
  { label: 'Blocked Road', value: 'BLOCKED_ROAD' },
  { label: 'Water', value: 'WATER' },
  { label: 'Shelter', value: 'SHELTER' },
  { label: 'Other', value: 'OTHER' },
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
  const highCount = incidents.filter((i) => i.severity === 'HIGH').length;
  const activeCount = incidents.filter((i) => i.status === 'OPEN' || i.status === 'MONITORING').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Emergency Header Bar */}
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>
          BLACKOUT • P2P INCIDENT LEDGER
        </Text>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            ALERT DIRECTORY
          </Text>

          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor: `${theme.colors.networkActive}18`,
                borderColor: `${theme.colors.networkActive}40`,
              },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: theme.colors.networkActive }]} />
            <Text style={[styles.liveBadgeText, { color: theme.colors.networkActive }]}>
              MESH ACTIVE
            </Text>
          </View>
        </View>

        {/* Dynamic Incident Summary Metrics */}
        <View
          style={[
            styles.statsBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {incidents.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.surfaceBorder }]} />

          <View style={styles.statItem}>
            <Text
              style={[
                styles.statNumber,
                { color: criticalCount > 0 ? theme.colors.severityCritical : theme.colors.textPrimary },
              ]}
            >
              {criticalCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Critical</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.surfaceBorder }]} />

          <View style={styles.statItem}>
            <Text
              style={[
                styles.statNumber,
                { color: highCount > 0 ? theme.colors.severityHigh : theme.colors.textPrimary },
              ]}
            >
              {highCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>High</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.surfaceBorder }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {activeCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active</Text>
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
                activeOpacity={0.7}
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

      <SectionHeader title={`INCIDENTS IN RANGE (${incidents.length})`} />

      {/* Main Content States */}
      {isLoading && incidents.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>
            Querying Incident Ledger...
          </Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            Scanning local database and peer mesh nodes.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <ErrorState
            message={error.message || 'An error occurred while fetching incident data.'}
            onRetry={refresh}
          />
        </View>
      ) : incidents.length === 0 ? (
        <View style={styles.stateContainer}>
          <EmptyState
            icon="🛡️"
            title="No Incidents Found"
            description={
              filterCategory
                ? `No active emergency incidents matching filter "${filterCategory}".`
                : 'Your local ledger reports no active emergency incidents in range.'
            }
            actionLabel={filterCategory ? 'Clear Filter' : 'Refresh Ledger'}
            onAction={filterCategory ? () => setFilterCategory(undefined) : refresh}
          />
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
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
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
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  filterRow: {
    marginBottom: 14,
    height: 44,
  },
  filterListContent: {
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  stateSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});



