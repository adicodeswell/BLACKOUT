import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface StatusPillProps {
  label: string;
  variant?: 'active' | 'warning' | 'danger' | 'neutral' | 'info';
  showDot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'neutral',
  showDot = true,
}) => {
  const { theme } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'active':
        return {
          bg: `${theme.colors.networkActive}18`,
          border: `${theme.colors.networkActive}40`,
          text: theme.colors.networkActive,
        };
      case 'warning':
        return {
          bg: theme.colors.warningBg,
          border: theme.colors.warningBorder,
          text: theme.colors.warningText,
        };
      case 'danger':
        return {
          bg: theme.colors.dangerBg,
          border: theme.colors.dangerBorder,
          text: theme.colors.dangerText,
        };
      case 'info':
        return {
          bg: theme.colors.infoBg,
          border: theme.colors.infoBorder,
          text: theme.colors.infoText,
        };
      case 'neutral':
      default:
        return {
          bg: `${theme.colors.textSecondary}18`,
          border: `${theme.colors.textSecondary}40`,
          text: theme.colors.textSecondary,
        };
    }
  };

  const { bg, border, text } = getVariantColors();

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border, borderRadius: theme.radius.pill }]}>
      {showDot && <Text style={{ color: text, fontSize: 8, marginRight: 4 }}>●</Text>}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});
