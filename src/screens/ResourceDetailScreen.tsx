import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useResourceDetail } from '../hooks/useResourceDetail';
import type { ResourceService } from '../services/ResourceService';
import type { ResourceAvailability, ResourceType } from '../contracts/data/ResourceDto';

interface ResourceDetailScreenProps {
  resourceId: string;
  resourceService: ResourceService;
  onBack: () => void;
}

const AVAILABILITY_OPTIONS: ResourceAvailability[] = [
  'AVAILABLE',
  'LIMITED',
  'FULL',
  'CLOSED',
  'UNKNOWN',
];

const TYPE_EMOJI_MAP: Record<ResourceType, string> = {
  WATER: '💧',
  FOOD: '🍲',
  SHELTER: '⛺',
  MEDICINE: '💊',
  MEDICAL: '🚑',
  OTHER: '📦',
};

export const ResourceDetailScreen: React.FC<ResourceDetailScreenProps> = ({
  resourceId,
  resourceService,
  onBack,
}) => {
  const { theme } = useTheme();
  const {
    resource,
    isLoading,
    error,
    updateAvailability,
  } = useResourceDetail(resourceService, resourceId);

  const getAvailabilityColor = (availability?: ResourceAvailability) => {
    switch (availability) {
      case 'AVAILABLE':
        return theme.colors.confidenceConfirmed;
      case 'LIMITED':
        return theme.colors.severityMedium;
      case 'FULL':
      case 'CLOSED':
        return theme.colors.severityCritical;
      case 'UNKNOWN':
      default:
        return theme.colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading Resource Details...
        </Text>
      </View>
    );
  }

  if (error || !resource) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.dangerBg }]}>
          <Text style={styles.iconCircleText}>⚠️</Text>
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>
          Resource Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          {error?.message || 'The requested resource station could not be found.'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Return to Directory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const availColor = getAvailabilityColor(resource.availability);
  const emoji = TYPE_EMOJI_MAP[resource.type] || '📦';

  const capacityPercent =
    resource.capacity && resource.remaining_capacity !== undefined
      ? Math.round((resource.remaining_capacity / resource.capacity) * 100)
      : undefined;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Navigation Bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.navIdText, { color: theme.colors.textSecondary }]}>
            RESOURCE #{resource.resource_id}
          </Text>
        </View>

        {/* 1. Resource Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              borderLeftColor: availColor,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '18' }]}>
              <Text style={styles.typeBadgeEmoji}>{emoji}</Text>
              <Text style={[styles.typeBadgeText, { color: theme.colors.primary }]}>{resource.type}</Text>
            </View>
            <View style={[styles.availBadge, { backgroundColor: availColor + '18', borderColor: availColor }]}>
              <View style={[styles.availDot, { backgroundColor: availColor }]} />
              <Text style={[styles.availBadgeText, { color: availColor }]}>{resource.availability}</Text>
            </View>
          </View>

          <Text style={[styles.heroName, { color: theme.colors.textPrimary }]}>{resource.name}</Text>
          {resource.description && (
            <Text style={[styles.heroDesc, { color: theme.colors.textSecondary }]}>{resource.description}</Text>
          )}

          <View style={[styles.heroMetaRow, { borderTopColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.heroMetaText, { color: theme.colors.textSecondary }]}>
              📡 Source Node: {resource.source_device_id.slice(0, 12)}
            </Text>
            <Text style={[styles.heroMetaText, { color: theme.colors.textSecondary }]}>
              🔄 Updated: {new Date(resource.updated_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* 2. Capacity & Availability Card */}
        {capacityPercent !== undefined && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>📊 Capacity & Stock Level</Text>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceBorder }]}>
              <View style={[styles.fill, { width: `${capacityPercent}%`, backgroundColor: availColor }]} />
            </View>
            <View style={styles.capacityMetaRow}>
              <Text style={[styles.capacityValueText, { color: theme.colors.textPrimary }]}>
                {resource.remaining_capacity} {resource.type} units remaining
              </Text>
              <Text style={[styles.capacityTotalText, { color: theme.colors.textSecondary }]}>
                Total Capacity: {resource.capacity}
              </Text>
            </View>
          </View>
        )}

        {/* 3. Location Information */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>📍 Location Coordinates</Text>
          <View style={[styles.locationBox, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.locationCoordsText, { color: theme.colors.textPrimary }]}>
              {resource.location.latitude.toFixed(5)}, {resource.location.longitude.toFixed(5)}
            </Text>
            <Text style={[styles.locationAccuracyText, { color: theme.colors.textSecondary }]}>
              GNSS Fix Accuracy: ±{resource.location.accuracy_m} meters
            </Text>
          </View>
        </View>

        {/* 4. Update Availability Action */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>⚙️ Update Availability Status</Text>
          <View style={styles.chipGroup}>
            {AVAILABILITY_OPTIONS.map((availOpt) => {
              const isSelected = resource.availability === availOpt;
              return (
                <TouchableOpacity
                  key={availOpt}
                  style={[
                    styles.chipOption,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => updateAvailability(availOpt)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipOptionText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {availOpt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconCircleText: { fontSize: 24 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  errorSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16, maxWidth: 280 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  backButtonText: { fontSize: 13, fontWeight: '600' },
  navIdText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroCard: { padding: 18, borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, marginBottom: 14 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  typeBadgeEmoji: { fontSize: 14 },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  availBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 5 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availBadgeText: { fontSize: 10, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: 6 },
  heroDesc: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  heroMetaRow: { paddingTop: 10, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
  heroMetaText: { fontSize: 11, fontWeight: '500' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  track: { height: 8, borderRadius: 4, width: '100%', marginBottom: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  capacityMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityValueText: { fontSize: 13, fontWeight: '700' },
  capacityTotalText: { fontSize: 12 },
  locationBox: { padding: 12, borderRadius: 8 },
  locationCoordsText: { fontSize: 14, fontWeight: '700' },
  locationAccuracyText: { fontSize: 12, marginTop: 2 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipOptionText: { fontSize: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
