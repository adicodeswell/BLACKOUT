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
import type { ResourceService } from '../services/ResourceService';
import type { ResourceType } from '../contracts/data/ResourceDto';

interface ResourcesScreenProps {
  resourceService: ResourceService;
  onSelectResource: (resourceId: string) => void;
  onAddResource?: () => void;
}

const RESOURCE_FILTERS: Array<{ label: string; value: ResourceType | undefined }> = [
  { label: 'All Resources', value: undefined },
  { label: '💧 Water', value: 'WATER' },
  { label: '🍲 Food', value: 'FOOD' },
  { label: '⛺ Shelter', value: 'SHELTER' },
  { label: '🚑 Medical', value: 'MEDICAL' },
  { label: '💊 Medicine', value: 'MEDICINE' },
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

  const availableCount = resources.filter((r) => r.availability === 'AVAILABLE').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Resource Directory</Text>
          {onAddResource && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
              onPress={onAddResource}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Offline Emergency Aid & Supplies ({availableCount} available nearby)
        </Text>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
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
            <Text style={styles.iconCircleText}>⚠️</Text>
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
            <Text style={styles.iconCircleText}>📦</Text>
          </View>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>No Resources Found</Text>
          <Text style={[styles.stateSubtext, { color: theme.colors.textSecondary }]}>
            {filterType
              ? `No aid stations matching resource type "${filterType}".`
              : 'No offline emergency resources have been logged in your local directory.'}
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
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
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
