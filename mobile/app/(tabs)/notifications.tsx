import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, spacing, typography } from "../../theme/tokens";
import { notifications } from "../../lib/mock-data";

type Notification = typeof notifications[number];
type LoadState = "loading" | "success" | "error" | "empty";

export default function NotificationsScreen() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(notifications);
      setLoadState(notifications.length === 0 ? "empty" : "success");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loadState === "loading") {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (loadState === "error") {
    return <View style={styles.centered}><Text style={styles.errorText}>Could not load notifications.</Text></View>;
  }
  if (loadState === "empty") {
    return <View style={styles.centered}><Text style={styles.emptyText}>You are all caught up!</Text></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.row, !item.read && styles.unread]} activeOpacity={0.8}>
          {!item.read && <View style={styles.dot} />}
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  list: { paddingVertical: spacing.sm, paddingBottom: spacing["3xl"] },
  row: { flexDirection: "row", alignItems: "flex-start", padding: spacing.base, gap: spacing.sm },
  unread: { backgroundColor: colors.primaryAlpha10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5, flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  body: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: 4 },
  time: { fontSize: typography.fontSize.xs, color: colors.textMuted },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.base },
  errorText: { color: colors.error, fontSize: typography.fontSize.base },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSize.md },
});
