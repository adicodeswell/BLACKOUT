import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ResourceDto, ResourceAvailability, ResourceType } from '../contracts/data/ResourceDto';

interface ResourceCardProps {
  resource: ResourceDto;
  onPress: () => void;
}

const TYPE_EMOJI_MAP: Record<ResourceType, string> = {
  WATER: '💧',
  FOOD: '🍲',
  SHELTER: '⛺',
  MEDICINE: '💊',
  MEDICAL: '🚑',
  OTHER: '📦',
};

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onPress }) => {
  const { theme } = useTheme();

  const getAvailabilityColor = (availability: ResourceAvailability) => {
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

  const timeAgo = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const availColor = getAvailabilityColor(resource.availability);
  const emoji = TYPE_EMOJI_MAP[resource.type] || '📦';

  // Capacity percentage calculation
  const hasCapacityData = resource.capacity && resource.remaining_capacity !== undefined;
  const capacityPercent = hasCapacityData
    ? Math.min(100, Math.max(0, Math.round((resource.remaining_capacity! / resource.capacity!) * 100)))
    : undefined;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.surfaceBorder,
          borderLeftColor: availColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.typeBadgeGroup}>
          <Text style={styles.typeEmoji}>{emoji}</Text>
          <Text style={[styles.typeText, { color: theme.colors.textPrimary }]}>{resource.type}</Text>
        </View>

        <View style={[styles.availBadge, { backgroundColor: availColor + '18', borderColor: availColor }]}>
          <View style={[styles.availDot, { backgroundColor: availColor }]} />
          <Text style={[styles.availBadgeText, { color: availColor }]}>{resource.availability}</Text>
        </View>
      </View>

      {/* 2. Resource Name & Description */}
      <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {resource.name}
      </Text>
      {resource.description ? (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {resource.description}
        </Text>
      ) : null}

      {/* 3. Capacity Bar & Units */}
      {hasCapacityData && capacityPercent !== undefined && (
        <View style={styles.capacityContainer}>
          <View style={styles.capacityMetaRow}>
            <Text style={[styles.remainingText, { color: theme.colors.textPrimary }]}>
              {resource.remaining_capacity} / {resource.capacity} units remaining
            </Text>
            <Text style={[styles.percentText, { color: availColor }]}>{capacityPercent}%</Text>
          </View>
          <View style={[styles.capacityTrack, { backgroundColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.capacityFill, { width: `${capacityPercent}%`, backgroundColor: availColor }]} />
          </View>
        </View>
      )}

      {/* 4. Footer Metadata */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.surfaceBorder }]}>
        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
          📍 {resource.location.latitude.toFixed(4)}, {resource.location.longitude.toFixed(4)}
        </Text>
        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
          Updated {timeAgo(resource.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  capacityContainer: {
    marginBottom: 12,
  },
  capacityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  capacityTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

