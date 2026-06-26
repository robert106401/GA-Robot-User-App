import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radii, spacing, statusColors } from "../theme";

type ActionTileTone = "neutral" | "success" | "info" | "warning" | "danger";

type ActionTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: string | number;
  tone?: ActionTileTone;
  iconColor?: string;
  selected?: boolean;
  columns?: 3 | 4;
  compact?: boolean;
  layout?: "stacked" | "segment";
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function ActionTile({
  icon,
  label,
  badge,
  tone = "neutral",
  iconColor = colors.coffee,
  selected = false,
  columns = 4,
  compact = false,
  layout = "stacked",
  style,
  onPress
}: ActionTileProps) {
  const toneColors = getTone(tone);
  const isSegment = layout === "segment";

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.84 : 1}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tile,
        isSegment && styles.segmentTile,
        columns === 3 && styles.tileThree,
        compact && styles.tileCompact,
        selected && styles.tileSelected,
        style
      ]}
    >
      {isSegment ? (
        <>
          <View style={[styles.segmentIconWrap, selected && styles.iconWrapSelected]}>
            <Ionicons name={icon} size={16} color={selected ? colors.ink : iconColor} />
          </View>
          <Text style={[styles.segmentLabel, selected && styles.labelSelected]} numberOfLines={1}>
            {label}
          </Text>
          {badge !== undefined ? (
            <View style={[styles.segmentBadge, { backgroundColor: selected ? "rgba(255,255,255,0.18)" : toneColors.background }]}>
              <Text style={[styles.segmentBadgeText, { color: selected ? colors.onDark : toneColors.text }]} numberOfLines={1}>
                {badge}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
      {badge !== undefined ? (
        <View style={[styles.badge, { backgroundColor: selected ? "rgba(255,255,255,0.18)" : toneColors.background }]}>
          <Text
            style={[styles.badgeText, { color: selected ? colors.onDark : toneColors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons name={icon} size={compact ? 20 : 23} color={selected ? colors.ink : iconColor} />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getTone(tone: ActionTileTone) {
  if (tone === "success") return statusColors.success;
  if (tone === "info") return statusColors.info;
  if (tone === "warning") return statusColors.warning;
  if (tone === "danger") return statusColors.danger;
  return statusColors.neutral;
}

const styles = StyleSheet.create({
  tile: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    minHeight: 88,
    paddingHorizontal: spacing.xs,
    paddingTop: 24,
    paddingBottom: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  tileThree: {
    flexBasis: "31.9%",
    flexGrow: 0
  },
  segmentTile: {
    minHeight: 40,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 34,
    flexDirection: "row",
    gap: 0
  },
  tileCompact: {
    minHeight: 70,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  tileSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  badge: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    minHeight: 21,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700"
  },
  iconWrap: {
    width: 36,
    height: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  iconWrapSelected: {
    borderRadius: radii.md,
    backgroundColor: colors.surface
  },
  segmentIconWrap: {
    position: "absolute",
    left: 6,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.tint
  },
  segmentBadge: {
    position: "absolute",
    right: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.tint
  },
  segmentBadgeText: {
    fontSize: 11,
    fontWeight: "700"
  },
  segmentLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center"
  },
  label: {
    maxWidth: "100%",
    color: colors.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
    textAlign: "center"
  },
  labelSelected: {
    color: colors.onDark
  }
});
