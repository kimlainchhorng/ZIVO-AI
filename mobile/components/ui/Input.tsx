import React from "react";
import { TextInput, View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, borderRadius, typography } from "../../theme/tokens";

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  style?: ViewStyle;
}

export function Input({ label, value, onChangeText, placeholder, error, secureTextEntry, autoCapitalize, style }: InputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? "sentences"}
        style={[styles.input, error ? styles.inputError : undefined]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  inputError: { borderColor: colors.error },
  error: { fontSize: typography.fontSize.xs, color: colors.error },
});
