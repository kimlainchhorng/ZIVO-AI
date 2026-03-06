import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, spacing, borderRadius, typography } from "../../theme/tokens";
import { currentUser, type User } from "../../lib/mock-data";

type LoadState = "loading" | "success" | "error";

export default function ProfileScreen() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(currentUser);
      setLoadState("success");
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (loadState === "loading") {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (loadState === "error" || !user) {
    return <View style={styles.centered}><Text style={styles.errorText}>Could not load profile.</Text></View>;
  }

  const menuItems = [
    { label: "Edit Profile", icon: "✏" },
    { label: "Notifications", icon: "🔔" },
    { label: "Privacy & Security", icon: "🔒" },
    { label: "Help & Support", icon: "💬" },
    { label: "Sign Out", icon: "↩" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar & name */}
      <View style={styles.header}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>42</Text>
          <Text style={styles.statLbl}>Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>18</Text>
          <Text style={styles.statLbl}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>7</Text>
          <Text style={styles.statLbl}>Orders</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuRow} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.joined}>Member since {user.joinedAt}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing["3xl"] },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { alignItems: "center", padding: spacing["2xl"], paddingTop: spacing["3xl"] },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: spacing.md, borderWidth: 3, borderColor: colors.primary },
  name: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  email: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  roleBadge: { backgroundColor: colors.primaryAlpha20, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: colors.primaryAlpha40 },
  roleText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.primary },
  statsRow: { flexDirection: "row", backgroundColor: colors.surface, marginHorizontal: spacing.base, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statLbl: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  menu: { marginHorizontal: spacing.base, backgroundColor: colors.surface, borderRadius: borderRadius.xl, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  menuRow: { flexDirection: "row", alignItems: "center", padding: spacing.base, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { fontSize: 18, width: 24, textAlign: "center" },
  menuLabel: { flex: 1, fontSize: typography.fontSize.base, color: colors.textPrimary },
  menuChevron: { fontSize: 18, color: colors.textMuted },
  joined: { textAlign: "center", fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: spacing.xl },
  errorText: { color: colors.error, fontSize: typography.fontSize.base },
});
