import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  ArrowLeft,
  Bell,
  Navigation,
  Plus,
  Car,
  Clock,
  ArrowLeftRight,
} from "lucide-react-native";
import { colors, spacing, borderRadius, typography } from "../../theme/tokens";

// ─── Constants ───────────────────────────────────────────────────────────────

const MARKER_TEXT_COLOR = "#ffffff";
const STOP_MARKER_COLOR = "#64748b";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StopRow {
  label: string;
  title: string;
  address: string;
  markerColor: string;
  markerTextColor: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const stops: StopRow[] = [
  {
    label: "Z",
    title: "Pickup",
    address: "109 Hickory St, Denham Springs, LA 70726, USA",
    markerColor: colors.success,
    markerTextColor: MARKER_TEXT_COLOR,
  },
  {
    label: "S",
    title: "Stop 1",
    address: "7454 Scenic Hwy, Baton Rouge, LA 70807, USA",
    markerColor: STOP_MARKER_COLOR,
    markerTextColor: MARKER_TEXT_COLOR,
  },
  {
    label: "E",
    title: "Destination",
    address: "7273 Greenwell Springs Rd, Baton Rouge, LA 70805, USA",
    markerColor: colors.error,
    markerTextColor: MARKER_TEXT_COLOR,
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function MarkerBadge({
  label,
  color,
  textColor,
  size = 28,
}: {
  label: string;
  color: string;
  textColor: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.markerBadge,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.markerLabel, { color: textColor, fontSize: size * 0.43 }]}>
        {label}
      </Text>
    </View>
  );
}

function StopRowItem({ stop }: { stop: StopRow }) {
  return (
    <View style={styles.stopRow}>
      <MarkerBadge
        label={stop.label}
        color={stop.markerColor}
        textColor={stop.markerTextColor}
        size={36}
      />
      <View style={styles.stopInfo}>
        <Text style={styles.stopTitle}>{stop.title}</Text>
        <Text style={styles.stopAddress} numberOfLines={1}>
          {stop.address}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RideScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <ArrowLeft color={colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zivo Ride</Text>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <Bell color={colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        {/* Background grid to simulate map tiles */}
        <View style={styles.mapGrid} />

        {/* Route line: Z → S → E */}
        <View style={styles.routeLineWrapper}>
          {/* Z to S segment */}
          <View style={[styles.routeSegment, { flex: 1 }]}>
            <View style={styles.routeDash} />
          </View>
          {/* S to E segment */}
          <View style={[styles.routeSegment, { flex: 1 }]}>
            <View style={styles.routeDash} />
          </View>
        </View>

        {/* Markers positioned left → middle → right */}
        {/* Z — Pickup (left) */}
        <View style={[styles.mapMarker, { left: "12%" }]}>
          <MarkerBadge label="Z" color={colors.success} textColor={MARKER_TEXT_COLOR} size={32} />
        </View>

        {/* S — Stop 1 (center) */}
        <View style={[styles.mapMarker, { left: "47%" }]}>
          <MarkerBadge label="S" color={STOP_MARKER_COLOR} textColor={MARKER_TEXT_COLOR} size={32} />
        </View>

        {/* E — Destination (right) */}
        <View style={[styles.mapMarker, { left: "78%" }]}>
          <MarkerBadge label="E" color={colors.error} textColor={MARKER_TEXT_COLOR} size={32} />
        </View>

        {/* Car emoji near the route between S and E */}
        <View style={styles.carIcon}>
          <Car color={colors.textSecondary} size={18} />
        </View>

        {/* Location arrow — top right */}
        <TouchableOpacity style={styles.locationBtn} activeOpacity={0.8}>
          <Navigation color={colors.textPrimary} size={16} />
        </TouchableOpacity>

        {/* Zoom controls — right side */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.8}>
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.8}>
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom details panel */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stop list */}
        {stops.map((stop, index) => (
          <React.Fragment key={stop.label}>
            <StopRowItem stop={stop} />
            {index < stops.length - 1 && <View style={styles.stopDivider} />}
          </React.Fragment>
        ))}

        {/* Horizontal divider */}
        <View style={styles.divider} />

        {/* Trip stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Clock color={colors.textSecondary} size={16} />
            <Text style={styles.statValue}>28 min</Text>
            <Text style={styles.statLabel}>Trip time</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statItem}>
            <ArrowLeftRight color={colors.textSecondary} size={16} />
            <Text style={styles.statValue}>9.4 mi</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>

        {/* Add Stop button */}
        <TouchableOpacity style={styles.addStopBtn} activeOpacity={0.7}>
          <Plus color={colors.success} size={16} />
          <Text style={styles.addStopText}>Add Stop</Text>
        </TouchableOpacity>

        {/* Choose a ride CTA */}
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Choose a ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    letterSpacing: 0.3,
  },

  // Map
  mapContainer: {
    height: 220,
    backgroundColor: "#1e2235",
    position: "relative",
    overflow: "hidden",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a2030",
  },

  // Route line
  routeLineWrapper: {
    position: "absolute",
    top: "52%",
    left: "16%",
    right: "14%",
    flexDirection: "row",
    alignItems: "center",
    height: 2,
  },
  routeSegment: {
    overflow: "hidden",
    height: 2,
    justifyContent: "center",
  },
  routeDash: {
    flex: 1,
    height: 2,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 1,
  },

  // Map markers
  mapMarker: {
    position: "absolute",
    top: "38%",
    alignItems: "center",
  },
  markerBadge: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  markerLabel: {
    fontWeight: typography.fontWeight.bold,
  },

  // Car icon
  carIcon: {
    position: "absolute",
    top: "35%",
    left: "62%",
    opacity: 0.85,
  },

  // Map controls
  locationBtn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  zoomControls: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: {
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Panel
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  panelContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing["2xl"],
  },

  // Stop rows
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stopAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  stopDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.base,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: spacing.xl,
  },
  statItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statSeparator: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },

  // Add Stop
  addStopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.base,
  },
  addStopText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },

  // CTA
  ctaBtn: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  ctaBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: MARKER_TEXT_COLOR,
    letterSpacing: 0.3,
  },
});
