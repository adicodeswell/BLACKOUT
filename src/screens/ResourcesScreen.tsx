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
import { useResources } from '../hooks/useResources';
import { ResourceCard } from '../components/ResourceCard';
import { NavIcon, NavIconName } from '../components/NavIcon';
import type { ResourceService } from '../services/ResourceService';
import type { ResourceType } from '../contracts/data/ResourceDto';

interface ResourcesScreenProps {
  resourceService: ResourceService;
  onSelectResource: (resourceId: string) => void;
  onAddResource?: () => void;
}

const RESOURCE_FILTERS: Array<{ label: string; value: ResourceType | undefined; icon: NavIconName }> = [
  { label: 'All', value: undefined, icon: 'Resources' },
  { label: 'Water', value: 'WATER', icon: 'WATER' },
  { label: 'Food', value: 'FOOD', icon: 'FOOD' },
  { label: 'Shelter', value: 'SHELTER', icon: 'SHELTER' },
  { label: 'Medical', value: 'MEDICAL', icon: 'MEDICAL' },
  { label: 'Medicine', value: 'MEDICINE', icon: 'MEDICAL' },
  { label: 'Other', value: 'OTHER', icon: 'OTHER' },
];

export const ResourcesScreen: React.FC<ResourcesScreenProps> = ({
  resourceService,
  onSelectResource,
  onAddResource,
}) => {
  const { theme } = useTheme();
  const {
    resources,
    isLoading,
    error,
    refresh,
    filterType,
    setFilterType,
  } = useResources(resourceService);

  // Operational status breakdown calculated dynamically
  const availableCount = resources.filter((r) => r.availability === 'AVAILABLE').length;
  const limitedCount = resources.filter((r) => r.availability === 'LIMITED').length;
  const unavailableCount = resources.filter((r) => r.availability === 'FULL' || r.availability === 'CLOSED').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>RESOURCE DIRECTORY</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Local Emergency Supplies</Text>
          </View>
          {onAddResource && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
              onPress={onAddResource}
              activeOpacity={0.8}
            >
              <NavIcon name="PLUS" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Resource</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Compact Operational Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={[styles.summaryPill, { backgroundColor: `${theme.colors.confidenceConfirmed}15`, borderColor: theme.colors.confidenceConfirmed }]}>
            <Text style={{ color: theme.colors.confidenceConfirmed, fontSize: 8 }}>● </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.confidenceConfirmed }]}>{availableCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.confidenceConfirmed }]}> AVAILABLE</Text>
          </View>

          <View style={[styles.summaryPill, { backgroundColor: `${theme.colors.severityMedium}15`, borderColor: theme.colors.severityMedium }]}>
            <Text style={{ color: theme.colors.severityMedium, fontSize: 8 }}>● </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.severityMedium }]}>{limitedCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.severityMedium }]}> LIMITED</Text>
          </View>

          <View style={[styles.summaryPill, { backgroundColor: `${theme.colors.severityCritical}15`, borderColor: theme.colors.severityCritical }]}>
            <Text style={{ color: theme.colors.severityCritical, fontSize: 8 }}>● </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.severityCritical }]}>{unavailableCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.severityCritical }]}> UNAVAILABLE</Text>
          </View>
        </View>
      </View>

      {/* 3. Filter Row */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RESOURCE_FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = filterType === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                  },
                ]}
                onPress={() => setFilterType(item.value)}
                activeOpacity={0.8}
              >
                <NavIcon
                  name={item.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
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

      {/* 4. Main Content States */}
      {isLoading && resources.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>Syncing Resource Directory...</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            Fetching offline supply stations from local storage.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.dangerBg }]}>
            <NavIcon name="WARNING" size={24} color={theme.colors.severityCritical} />
          </View>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>Unable to Load Resources</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            {error.message}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={refresh}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Retry Local Sync</Text>
          </TouchableOpacity>
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceBorder }]}>
            <NavIcon name="Resources" size={28} color={theme.colors.textSecondary} />
          </View>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>RESOURCE DIRECTORY EMPTY</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            {filterType
              ? `No emergency aid stations matching resource type "${filterType}".`
              : 'No local emergency resources have been recorded yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.resource_id}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onPress={() => onSelectResource(item.resource_id)}
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
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterListContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
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
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
