import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.dangerBg,
          borderColor: theme.colors.dangerBorder,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.dangerText }]}>⚠️ {message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
          <Text style={[styles.retryText, { color: theme.colors.primaryDanger }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
