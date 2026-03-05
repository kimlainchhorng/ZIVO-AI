import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/mobile/theme/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: "transparent" },
  destructive: { backgroundColor: colors.error },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  lg: { paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, borderRadius: borderRadius.xl },
};

const labelColorMap: Record<ButtonVariant, string> = {
  primary: "#fff",
  secondary: colors.textPrimary,
  ghost: colors.textPrimary,
  destructive: "#fff",
};

const labelSizeMap: Record<ButtonSize, number> = {
  sm: typography.fontSize.xs,
  md: typography.fontSize.base,
  lg: typography.fontSize.md,
};

export function Button({ label, onPress, variant = "primary", size = "md", loading = false, disabled = false, style }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, variantStyles[variant], sizeStyles[size], (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColorMap[variant]} />
      ) : (
        <Text style={[styles.label, { color: labelColorMap[variant], fontSize: labelSizeMap[size] }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", flexDirection: "row" },
  label: { fontWeight: typography.fontWeight.semibold },
  disabled: { opacity: 0.5 },
});
