import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radii, spacing, statusColors, typography } from "../theme";

type OptionTileVariant = "card" | "chip";

type OptionTileProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  recommended?: boolean;
  accent?: string;
  backgroundColor?: string;
  variant?: OptionTileVariant;
  emphasis?: "normal" | "large";
  align?: "left" | "center";
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function OptionTile({
  title,
  subtitle,
  meta,
  badge,
  icon,
  selected = false,
  recommended = false,
  accent = colors.success,
  backgroundColor,
  variant = "card",
  emphasis = "normal",
  align = "left",
  style,
  onPress
}: OptionTileProps) {
  const isChip = variant === "chip";
  const isCentered = align === "center";

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tile,
        isChip && styles.chip,
        backgroundColor ? { backgroundColor } : null,
        recommended && !selected && styles.recommended,
        style,
        selected && { backgroundColor: accent, borderColor: accent }
      ]}
    >
      {recommended && !isChip ? (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>MOST POPULAR</Text>
        </View>
      ) : null}
      {badge ? (
        <View style={[styles.badge, isCentered && styles.badgeCentered, selected && styles.badgeSelected]}>
          <Text style={[styles.badgeText, selected && styles.badgeTextSelected]} numberOfLines={1}>
            {badge}
          </Text>
        </View>
      ) : null}
      <View style={[styles.content, isChip && styles.chipContent, isCentered && styles.contentCentered]}>
        {icon ? (
          <View style={[styles.icon, selected && styles.iconSelected]}>
            <Ionicons name={selected ? "checkmark" : icon} size={isChip ? 13 : 20} color={selected ? accent : colors.coffee} />
          </View>
        ) : null}
        <View style={[styles.copy, !isChip && styles.cardCopy, isChip && styles.chipCopy, isCentered && styles.copyCentered]}>
          <Text
            style={[
              styles.title,
              isChip && styles.chipTitle,
              emphasis === "large" && styles.titleLarge,
              isCentered && styles.textCentered,
              selected && styles.titleSelected
            ]}
            numberOfLines={isChip ? 1 : 2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, isCentered && styles.textCentered, selected && styles.subtitleSelected]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={[styles.meta, isCentered && styles.textCentered, selected && styles.metaSelected]} numberOfLines={isChip ? 1 : 2}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: "relative",
    minHeight: 112,
    padding: spacing.md,
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md
  },
  recommended: {
    borderColor: colors.warning,
    backgroundColor: statusColors.warning.subtleBackground,
    borderWidth: 1.5
  },
  recommendedBadge: {
    position: "absolute",
    top: -9,
    left: 8,
    right: 8,
    minHeight: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: colors.ink
  },
  recommendedText: {
    color: colors.onDark,
    fontSize: 8,
    fontWeight: "800"
  },
  badge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 20,
    paddingHorizontal: 7,
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: statusColors.success.subtleBackground
  },
  badgeCentered: {
    alignSelf: "center"
  },
  badgeSelected: {
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  badgeText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: "800"
  },
  badgeTextSelected: {
    color: colors.onDark
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  chipContent: {
    marginTop: 0,
    gap: spacing.xs
  },
  contentCentered: {
    justifyContent: "center"
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.tint
  },
  iconSelected: {
    backgroundColor: colors.onDark
  },
  copy: {
    minWidth: 0
  },
  cardCopy: {
    flex: 1
  },
  chipCopy: {
    flexShrink: 1
  },
  copyCentered: {
    alignItems: "center"
  },
  title: {
    color: colors.ink,
    ...typography.label
  },
  titleLarge: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800"
  },
  textCentered: {
    textAlign: "center"
  },
  chipTitle: {
    fontSize: 11
  },
  titleSelected: {
    color: colors.onDark
  },
  subtitle: {
    color: colors.muted,
    ...typography.bodySmall,
    marginTop: 4
  },
  subtitleSelected: {
    color: "rgba(255,255,255,0.82)"
  },
  meta: {
    color: colors.coffee,
    ...typography.caption,
    fontWeight: "800",
    lineHeight: 13,
    marginTop: spacing.sm
  },
  metaSelected: {
    color: colors.onDark
  }
});
