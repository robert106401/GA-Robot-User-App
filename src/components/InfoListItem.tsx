import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { BaseListItem, ListTrailingConfig } from "./ListItem";
import { colors, typography } from "../theme";

type InfoValueTone = "neutral" | "accent" | "success" | "danger";

type InfoListItemProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  text?: string;
  value?: string;
  valueTone?: InfoValueTone;
  valueWidth?: number;
  detail?: ReactNode;
  titleAccessory?: ReactNode;
  trailing?: ListTrailingConfig;
  titleLines?: 1 | 2;
  keyValue?: boolean;
  contained?: boolean;
  compact?: boolean;
  last?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function InfoListItem({
  icon,
  title,
  text,
  value,
  valueTone = "neutral",
  valueWidth,
  detail,
  titleAccessory,
  trailing,
  titleLines = 1,
  keyValue = false,
  contained = false,
  compact = true,
  last = false,
  onPress,
  style
}: InfoListItemProps) {
  return (
    <BaseListItem
      contained={contained}
      density={compact ? "compact" : "regular"}
      leading={icon ? { type: "icon", icon, backgroundColor: colors.tint, color: colors.coffee } : undefined}
      title={title}
      titleTextStyle={keyValue ? styles.keyValueLabel : undefined}
      titleLines={titleLines}
      primary={text}
      detail={detail}
      titleAccessory={titleAccessory}
      trailing={trailing ?? getValueTrailing(value, valueTone, valueWidth, keyValue)}
      lines={titleLines > 1 ? 2 : undefined}
      last={last}
      onPress={onPress}
      style={style}
    />
  );
}

function getValueTrailing(
  value: string | undefined,
  tone: InfoValueTone,
  width: number | undefined,
  keyValue: boolean
): ListTrailingConfig | undefined {
  if (!value) {
    return undefined;
  }

  return {
    type: "custom",
    node: <Text style={[styles.value, keyValue && styles.keyValueValue, width ? { width } : undefined, styles[tone]]}>{value}</Text>
  };
}

const styles = StyleSheet.create({
  keyValueLabel: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600"
  },
  value: {
    maxWidth: 190,
    textAlign: "right",
    color: colors.ink,
    ...typography.bodySmall,
    fontWeight: "600"
  },
  keyValueValue: {
    maxWidth: 220,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  neutral: {
    color: colors.ink
  },
  accent: {
    color: colors.blue
  },
  success: {
    color: colors.success
  },
  danger: {
    color: colors.berry
  }
});
