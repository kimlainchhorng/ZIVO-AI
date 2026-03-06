import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "../../theme/tokens";
import { dashboardStats, featuredItems, recentActivity, type Stat, type ListItem } from "../../lib/mock-data";

type LoadState = "loading" | "success" | "error" | "empty";

export default function HomeScreen() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [stats, setStats] = useState<Stat[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    setLoadState("loading");
    try {
      // Simulate network request
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setStats(dashboardStats);
      setItems(featuredItems);
      setLoadState(featuredItems.length === 0 ? "empty" : "success");
    } catch {
      setLoadState("error");
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loadState === "loading") {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  if (loadState === "error") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>We could not load the dashboard. Please try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadState === "empty") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyTitle}>No data yet</Text>
        <Text style={styles.emptyBody}>Your dashboard will populate once you have activity.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.subheading}>Here is what is happening today</Text>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statChange, stat.positive ? styles.positive : styles.negative]}>
              {stat.change}
            </Text>
          </View>
        ))}
      </View>

      {/* Featured items */}
      <Text style={styles.sectionTitle}>Featured</Text>
      {items.map((item) => (
        <TouchableOpacity key={item.id} style={styles.itemCard} activeOpacity={0.8}>
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            {item.price && <Text style={styles.itemPrice}>{item.price}</Text>}
          </View>
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Recent activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentActivity.map((activity) => (
        <View key={activity.id} style={styles.activityRow}>
          <View style={styles.activityDot} />
          <View style={styles.activityContent}>
            <Text style={styles.activityAction}>{activity.action}</Text>
            <Text style={styles.activityMeta}>{activity.user} · {activity.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: spacing["3xl"] },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["2xl"],
  },
  heading: { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  subheading: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  loadingText: { marginTop: spacing.md, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  errorTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.error, marginBottom: spacing.sm },
  errorBody: { fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing["2xl"], paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  retryButtonText: { color: "#fff", fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyBody: { fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, minWidth: "46%", backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
  statChange: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  positive: { color: colors.success },
  negative: { color: colors.error },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  itemCard: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  itemImage: { width: 80, height: 80 },
  itemContent: { flex: 1, padding: spacing.sm, justifyContent: "center" },
  itemTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  itemSubtitle: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
  itemPrice: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
  badge: { position: "absolute", top: spacing.sm, right: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: typography.fontSize.xs, color: "#fff", fontWeight: typography.fontWeight.semibold },
  activityRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.sm, gap: spacing.sm },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 },
  activityContent: { flex: 1 },
  activityAction: { fontSize: typography.fontSize.sm, color: colors.textPrimary, fontWeight: typography.fontWeight.medium },
  activityMeta: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
