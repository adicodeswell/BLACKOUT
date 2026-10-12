import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Severity } from '../contracts/data/EmergencyReport';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'small' | 'medium';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'medium' }) => {
  const { theme } = useTheme();

  const getSeverityColor = () => {
    switch (severity?.toUpperCase()) {
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

  const color = getSeverityColor();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`,
          borderColor: `${color}50`,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: theme.radius.sm,
        },
      ]}
    >
      <Text style={{ color, fontSize: 8, marginRight: 4 }}>●</Text>
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSmall ? 10 : 11,
          },
        ]}
      >
        {severity?.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
