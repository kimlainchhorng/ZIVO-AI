import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { colors, spacing, borderRadius, typography } from "../../theme/tokens";
import { featuredItems, type ListItem } from "../../lib/mock-data";

type LoadState = "loading" | "success" | "error" | "empty";

export default function ExploreScreen() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(featuredItems);
      setLoadState(featuredItems.length === 0 ? "empty" : "success");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = query.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : items;

  if (loadState === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadState === "error") {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load. Pull down to retry.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search…"
        placeholderTextColor={colors.textMuted}
      />
      {filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              {item.price && <Text style={styles.cardPrice}>{item.price}</Text>}
            </TouchableOpacity>
          )}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  searchInput: {
    margin: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing["3xl"] },
  columnWrapper: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  cardImage: { width: "100%", height: 120 },
  cardTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.textPrimary, padding: spacing.sm, paddingBottom: 2 },
  cardSubtitle: { fontSize: typography.fontSize.xs, color: colors.textSecondary, paddingHorizontal: spacing.sm, paddingBottom: 4 },
  cardPrice: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  errorText: { color: colors.error, fontSize: typography.fontSize.base },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSize.base },
});
