import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { IncidentDto, IncidentStatus } from '../contracts/data/IncidentDto';
import type { Severity, VerificationLevel } from '../contracts/data/EmergencyReport';

interface IncidentCardProps {
  incident: IncidentDto;
  onPress: () => void;
}

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  FIRE: '🔥',
  FLOOD: '🌊',
  MEDICAL: '🚑',
  BUILDING_COLLAPSE: '🏗️',
  TRAPPED_PERSON: '🆘',
  BLOCKED_ROAD: '🚧',
  FOOD: '🍲',
  WATER: '💧',
  SHELTER: '⛺',
  OTHER: '⚠️',
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

  const getConfidenceColor = (level: VerificationLevel) => {
    switch (level) {
      case 'CONFIRMED':
        return theme.colors.confidenceConfirmed;
      case 'HIGH_CONFIDENCE':
        return theme.colors.confidenceHigh;
      case 'LIKELY':
        return theme.colors.confidenceLikely;
      case 'UNVERIFIED':
      default:
        return theme.colors.confidenceUnverified;
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return theme.colors.statusOpen;
      case 'MONITORING':
        return theme.colors.statusMonitoring;
      case 'RESOLVED':
        return theme.colors.statusResolved;
      case 'EXPIRED':
      default:
        return theme.colors.statusExpired;
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
  const confidenceColor = getConfidenceColor(incident.confidence_level);
  const statusColor = getStatusColor(incident.status);
  const emoji = CATEGORY_EMOJI_MAP[incident.category] || '⚠️';

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
      activeOpacity={0.8}
    >
      {/* 1. Header Row: Severity & Status Badges */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
            <Text style={styles.severityBadgeText}>{incident.severity}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{incident.status}</Text>
          </View>
        </View>

        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {timeAgo(incident.last_updated_at)}
        </Text>
      </View>

      {/* 2. Main Incident Title & Summary */}
      <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
        {emoji} {incident.title}
      </Text>
      <Text style={[styles.summary, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {incident.summary}
      </Text>

      {/* 3. Location Bar */}
      {incident.location && (
        <View style={styles.locationRow}>
          <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
            📍 {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
            {incident.location.accuracy_m ? ` (±${incident.location.accuracy_m}m)` : ''}
          </Text>
        </View>
      )}

      {/* 4. Bottom Metrics Bar */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.surfaceBorder }]}>
        <View style={styles.confidencePill}>
          <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
          <Text style={[styles.confidenceText, { color: theme.colors.textPrimary }]}>
            {incident.confidence_level.replace('_', ' ')}
          </Text>
          <Text style={[styles.sourceCountText, { color: theme.colors.textSecondary }]}>
            ({incident.independent_source_count} {incident.independent_source_count === 1 ? 'src' : 'srcs'})
          </Text>
        </View>

        <View style={styles.metricsGroup}>
          <Text style={[styles.metricItem, { color: theme.colors.textSecondary }]}>
            📷 {incident.evidence_count}
          </Text>
          {incident.contradiction_count > 0 && (
            <View style={[styles.contradictionBadge, { backgroundColor: theme.colors.severityCritical + '20' }]}>
              <Text style={[styles.contradictionText, { color: theme.colors.severityCritical }]}>
                ⚠️ {incident.contradiction_count}
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
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  locationRow: {
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
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceCountText: {
    fontSize: 11,
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  contradictionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contradictionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

