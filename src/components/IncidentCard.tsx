import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { StatusPill } from './StatusPill';
import { NavIcon, NavIconName } from './NavIcon';
import type { IncidentDto } from '../contracts/data/IncidentDto';
import type { Severity } from '../contracts/data/EmergencyReport';

interface IncidentCardProps {
  incident: IncidentDto;
  onPress: () => void;
}

const CATEGORY_ICON_MAP: Record<string, NavIconName> = {
  FIRE: 'FIRE',
  FLOOD: 'FLOOD',
  MEDICAL: 'MEDICAL',
  BUILDING_COLLAPSE: 'WARNING',
  TRAPPED_PERSON: 'WARNING',
  BLOCKED_ROAD: 'BLOCKED_ROAD',
  FOOD: 'Resources',
  WATER: 'WATER',
  SHELTER: 'SHELTER',
  OTHER: 'OTHER',
};

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onPress }) => {
  const { theme } = useTheme();

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return theme.colors.severityCritical;
      case 'HIGH':
        return theme.colors.severityHigh;
      case 'MEDIUM':
        return theme.colors.severityMedium;
      case 'LOW':
        return theme.colors.severityLow;
      case 'UNKNOWN':
      default:
        return theme.colors.severityUnknown;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'danger';
      case 'MONITORING':
        return 'warning';
      case 'RESOLVED':
        return 'active';
      case 'EXPIRED':
      default:
        return 'neutral';
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

  const severityColor = getSeverityColor(incident.severity);
  const iconName = CATEGORY_ICON_MAP[incident.category] || 'OTHER';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: incident.severity === 'CRITICAL' ? theme.colors.severityCritical + '60' : theme.colors.surfaceBorder,
          borderLeftColor: severityColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 1. Header Row: Severity & Status Badges */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <SeverityBadge severity={incident.severity} size="small" />
          <StatusPill label={incident.status} variant={getStatusVariant(incident.status)} showDot />
        </View>

        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {timeAgo(incident.last_updated_at)}
        </Text>
      </View>

      {/* 2. Main Incident Title & Summary */}
      <View style={styles.titleRow}>
        <NavIcon name={iconName} color={severityColor} size={18} />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {incident.title}
        </Text>
      </View>

      <Text style={[styles.summary, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {incident.summary}
      </Text>

      {/* 3. Location Bar */}
      {incident.location && (
        <View style={styles.locationRow}>
          <NavIcon name="LOCATION" color={theme.colors.textMuted} size={12} />
          <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
            {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
            {incident.location.accuracy_m ? ` (±${incident.location.accuracy_m}m)` : ''}
          </Text>
        </View>
      )}

      {/* 4. Bottom Metrics Bar */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.surfaceBorder }]}>
        <View style={styles.confidencePill}>
          <ConfidenceBadge level={incident.confidence_level} size="small" />
          <Text style={[styles.sourceCountText, { color: theme.colors.textSecondary }]}>
            ({incident.independent_source_count} {incident.independent_source_count === 1 ? 'src' : 'srcs'})
          </Text>
        </View>

        <View style={styles.metricsGroup}>
          <View style={styles.iconMetricInline}>
            <NavIcon name="EVIDENCE" color={theme.colors.textMuted} size={12} />
            <Text style={[styles.metricItem, { color: theme.colors.textSecondary }]}>
              {incident.evidence_count}
            </Text>
          </View>
          {incident.contradiction_count > 0 && (
            <View style={[styles.contradictionBadge, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}>
              <NavIcon name="WARNING" color={theme.colors.dangerText} size={10} />
              <Text style={[styles.contradictionText, { color: theme.colors.dangerText }]}>
                {incident.contradiction_count}
              </Text>
            </View>
          )}
        </View>
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
    minHeight: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flexShrink: 1,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceCountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconMetricInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  contradictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  contradictionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});



