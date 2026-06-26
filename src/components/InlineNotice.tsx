import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, spacing, statusColors } from "../theme";

type NoticeTone = "success" | "info" | "warning" | "danger" | "neutral";

type InlineNoticeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  meta?: string;
  tone?: NoticeTone;
  style?: StyleProp<ViewStyle>;
};

export function InlineNotice({
  icon,
  title,
  text,
  meta,
  tone = "info",
  style
}: InlineNoticeProps) {
  const toneTokens = getNoticeTone(tone);

  return (
    <View style={[styles.notice, style]}>
      <View style={[styles.icon, { backgroundColor: toneTokens.background }]}>
        <Ionicons name={icon} size={17} color={toneTokens.text} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {meta ? (
            <Text style={[styles.meta, { color: toneTokens.text }]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

function getNoticeTone(tone: NoticeTone) {
  switch (tone) {
    case "success":
      return statusColors.success;
    case "warning":
      return statusColors.warning;
    case "danger":
      return statusColors.danger;
    case "neutral":
      return statusColors.neutral;
    case "info":
    default:
      return statusColors.info;
  }
}

const styles = StyleSheet.create({
  notice: {
    paddingVertical: 11,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  copy: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  meta: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "800"
  },
  text: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16
  }
});
