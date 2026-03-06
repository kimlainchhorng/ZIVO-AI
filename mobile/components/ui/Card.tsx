import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, borderRadius, typography } from "../../theme/tokens";

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated";
}

export function Card({ title, subtitle, children, style, variant = "default" }: CardProps) {
  return (
    <View style={[styles.card, variant === "elevated" && styles.elevated, style]}>
      {(title ?? subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surfaceRaised,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  header: { marginBottom: spacing.sm },
  title: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
