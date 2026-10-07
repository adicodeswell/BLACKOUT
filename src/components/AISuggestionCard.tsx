import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NavIcon } from './NavIcon';
import type { ReportClassification } from '../contracts/ai/AIContracts';

interface AISuggestionCardProps {
  suggestion: ReportClassification;
  onApply: (category: string, severity?: string) => void;
  onDismiss: () => void;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
}) => {
  const { theme } = useTheme();

  const getSeverityColor = (severity?: string) => {
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

  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.mode === 'dark' ? '#141A29' : '#F0F4FF',
          borderColor: theme.colors.primary,
        },
      ]}
    >
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <NavIcon name="INFO" size={14} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
            AI ADVISORY SUGGESTION
          </Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: theme.colors.infoBg }]}>
          <Text style={[styles.confidenceText, { color: theme.colors.infoText }]}>
            {confidencePercent}% Confidence
          </Text>
        </View>
      </View>

      {/* Suggested Values */}
      <View style={styles.suggestionBody}>
        <View style={styles.valueGroup}>
          <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>Category:</Text>
          <View style={[styles.categoryChip, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.categoryText, { color: theme.colors.textPrimary }]}>
              {suggestion.category}
            </Text>
          </View>
        </View>

        {suggestion.severity && (
          <View style={styles.valueGroup}>
            <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>Severity:</Text>
            <View style={[styles.severityChip, { backgroundColor: getSeverityColor(suggestion.severity) }]}>
              <Text style={styles.severityText}>{suggestion.severity}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Rationale Explanation */}
      {suggestion.rationale ? (
        <Text style={[styles.rationaleText, { color: theme.colors.textSecondary }]}>
          Rationale: {suggestion.rationale}
        </Text>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onApply(suggestion.category, suggestion.severity)}
          activeOpacity={0.8}
        >
          <NavIcon name="CHECK" size={12} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Apply Suggestion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dismissButton, { borderColor: theme.colors.surfaceBorder }]}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissButtonText, { color: theme.colors.textSecondary }]}>
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginVertical: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    flexWrap: 'wrap',
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 2,
  },
  valueLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  severityChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rationaleText: {
    fontSize: 12,
    lineHeight: 16,
    marginVertical: 6,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    minHeight: 38,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
