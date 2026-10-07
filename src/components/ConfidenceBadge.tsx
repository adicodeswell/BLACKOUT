import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { VerificationLevel } from '../contracts/data/EmergencyReport';

interface ConfidenceBadgeProps {
  level: VerificationLevel | string;
  size?: 'small' | 'medium';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level, size = 'medium' }) => {
  const { theme } = useTheme();

  const getConfidenceColor = () => {
    switch (level?.toUpperCase()) {
      case 'CONFIRMED':
      case 'HIGH_CONFIDENCE':
        return theme.colors.confidenceConfirmed;
      case 'HIGH':
        return theme.colors.confidenceHigh;
      case 'LIKELY':
        return theme.colors.confidenceLikely;
      case 'UNVERIFIED':
      default:
        return theme.colors.confidenceUnverified;
    }
  };

  const color = getConfidenceColor();
  const isSmall = size === 'small';

  const formatLevel = (lvl: string) => {
    if (lvl === 'HIGH_CONFIDENCE') return 'HIGH CONFIDENCE';
    return lvl.replace('_', ' ');
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}18`,
          borderColor: `${color}40`,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: theme.radius.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSmall ? 10 : 11,
          },
        ]}
      >
        ✓ {formatLevel(level?.toUpperCase() || 'UNVERIFIED')}
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
