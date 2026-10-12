import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  hint,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.background,
            color: theme.colors.textPrimary,
            borderColor: error ? theme.colors.severityCritical : theme.colors.surfaceBorder,
            borderRadius: theme.radius.md,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textSecondary}
        {...props}
      />
      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.severityCritical }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 11,
    marginTop: 4,
  },
});
