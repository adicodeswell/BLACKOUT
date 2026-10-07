import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: theme.colors.primaryDanger,
          border: theme.colors.primaryDanger,
          text: '#FFFFFF',
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: theme.colors.surfaceBorder,
          text: theme.colors.textPrimary,
        };
      case 'primary':
      default:
        return {
          bg: theme.colors.primary,
          border: theme.colors.primary,
          text: '#FFFFFF',
        };
    }
  };

  const { bg, border, text } = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? `${bg}60` : bg,
          borderColor: disabled ? `${border}60` : border,
          borderRadius: theme.radius.md,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={text} />
      ) : (
        <Text style={[styles.text, { color: text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
});
