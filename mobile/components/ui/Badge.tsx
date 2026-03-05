import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/mobile/theme/tokens";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "rgba(255,255,255,0.08)", text: colors.textSecondary },
  primary: { bg: `${colors.primary}22`, text: colors.primary },
  success: { bg: `${colors.success}22`, text: colors.success },
  warning: { bg: `${colors.warning}22`, text: colors.warning },
  error: { bg: `${colors.error}22`, text: colors.error },
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  const { bg, text } = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, alignSelf: "flex-start" },
  text: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
});
