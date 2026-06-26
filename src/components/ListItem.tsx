import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { assetColors, colors, radii, spacing, statusColors, typography } from "../theme";

type ListTone = "neutral" | "success" | "warning" | "danger" | "info" | "exp" | "points" | "rewardBonus" | "voucher" | "coupon";
type ListDensity = "regular" | "compact";
type LeadingSize = "icon" | "visual" | "visualCompact";
type ListLineCount = 1 | 2 | 3;

export type ListLeadingConfig =
  | {
      type: "icon";
      icon: keyof typeof Ionicons.glyphMap;
      tone?: ListTone;
      backgroundColor?: string;
      color?: string;
    }
  | {
      type: "visual";
      label?: string;
      image?: ImageSourcePropType;
      backgroundColor?: string;
      icon?: keyof typeof Ionicons.glyphMap;
      color?: string;
    }
  | {
      type: "logo";
      label: string;
      backgroundColor: string;
      color: string;
      image?: ImageSourcePropType;
    }
  | {
      type: "none";
    }
  | {
      type: "custom";
      node: ReactNode;
    };

export type ListTrailingConfig =
  | {
      type: "action";
      label: string;
      tone?: ListTone;
    }
  | {
      type: "amount";
      value: string;
      meta?: string;
      tone?: ListTone;
    }
  | {
      type: "status";
      label: string;
      tone?: ListTone;
    }
  | {
      type: "countdown";
      expiresAt?: number | string;
      inactiveLabel?: string;
      active?: boolean;
      bottomLabel?: string;
      bottomTone?: ListTone;
      rowLines?: 2 | 3;
    }
  | {
      type: "radio";
      selected: boolean;
      disabled?: boolean;
    }
  | {
      type: "chevron";
    }
  | {
      type: "custom";
      node: ReactNode;
    };

type BaseListItemProps = {
  leading?: ListLeadingConfig;
  title: string;
  titleTextStyle?: StyleProp<TextStyle>;
  primary?: string;
  primaryTextStyle?: StyleProp<TextStyle>;
  secondary?: string;
  tertiary?: string;
  detail?: ReactNode;
  titleAccessory?: ReactNode;
  trailing?: ListTrailingConfig;
  lines?: ListLineCount;
  titleLines?: 1 | 2;
  density?: ListDensity;
  disabled?: boolean;
  last?: boolean;
  contained?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function BaseListItem({
  leading,
  title,
  titleTextStyle,
  primary,
  primaryTextStyle,
  secondary,
  tertiary,
  detail,
  titleAccessory,
  trailing,
  lines,
  titleLines = 1,
  density = "regular",
  disabled = false,
  last = false,
  contained = false,
  onPress,
  style
}: BaseListItemProps) {
  const leadingSize = leading?.type === "visual"
    ? density === "compact"
      ? "visualCompact"
      : "visual"
    : "icon";
  const inferredLines = lines ?? inferLineCount({ primary, secondary, tertiary, detail });
  const content = (
    <>
      {leading && leading.type !== "none" ? <ListLeading config={leading} size={leadingSize} /> : null}
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, titleTextStyle]} numberOfLines={titleLines}>{title}</Text>
          {titleAccessory}
        </View>
        {primary ? <Text style={[styles.primary, primaryTextStyle]} numberOfLines={1}>{primary}</Text> : null}
        {secondary ? <Text style={styles.secondary} numberOfLines={1}>{secondary}</Text> : null}
        {tertiary ? <Text style={styles.tertiary} numberOfLines={1}>{tertiary}</Text> : null}
        {detail}
      </View>
      {trailing ? <ListTrailing config={trailing} /> : null}
    </>
  );
  const rowStyle = [
    styles.row,
    inferredLines === 1 && styles.rowOneLine,
    inferredLines === 2 && styles.rowTwoLine,
    inferredLines === 3 && styles.rowThreeLine,
    density === "compact" && styles.rowCompact,
    contained && styles.rowContained,
    contained && inferredLines === 1 && styles.rowContainedOneLine,
    contained && inferredLines === 2 && styles.rowContainedTwoLine,
    contained && inferredLines === 3 && styles.rowContainedThreeLine,
    contained && density === "compact" && inferredLines === 1 && styles.rowContainedCompactOneLine,
    contained && density === "compact" && inferredLines === 2 && styles.rowContainedCompactTwoLine,
    contained && density === "compact" && inferredLines === 3 && styles.rowContainedCompactThreeLine,
    disabled && styles.rowDisabled,
    last && !contained && styles.rowLast,
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        accessibilityRole="button"
        disabled={disabled}
        style={rowStyle}
        onPress={onPress}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

function inferLineCount({
  primary,
  secondary,
  tertiary,
  detail
}: {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  detail?: ReactNode;
}): ListLineCount {
  const textLineCount = 1 + (primary ? 1 : 0) + (secondary || tertiary ? 1 : 0);
  return Math.min(3, textLineCount + (detail ? 1 : 0)) as ListLineCount;
}

export function ListLeading({ config, size = "icon" }: { config: Exclude<ListLeadingConfig, { type: "none" }>; size?: LeadingSize }) {
  if (config.type === "custom") {
    return <>{config.node}</>;
  }
  if (config.type === "logo") {
    return (
      <View style={[styles.leading, styles.leadingIcon, { backgroundColor: config.backgroundColor }]}>
        {config.image ? (
          <Image source={config.image} style={styles.logoImage} resizeMode="contain" />
        ) : (
          <Text style={[styles.logoText, { color: config.color }]}>{config.label}</Text>
        )}
      </View>
    );
  }
  if (config.type === "visual") {
    return (
      <View
        style={[
          styles.leading,
          size === "visualCompact" ? styles.leadingVisualCompact : styles.leadingVisual,
          { backgroundColor: config.backgroundColor ?? colors.tint }
        ]}
      >
        {config.image ? <Image source={config.image} style={styles.visualImage} resizeMode="contain" /> : null}
        {!config.image && config.icon ? (
          <Ionicons name={config.icon} size={size === "visualCompact" ? 22 : 26} color={config.color ?? colors.onDark} />
        ) : null}
        {config.label ? <Text style={styles.visualLabel} numberOfLines={1}>{config.label}</Text> : null}
      </View>
    );
  }
  const tone = getToneColors(config.tone ?? "neutral");
  return (
    <View
      style={[
        styles.leading,
        size === "visual" ? styles.leadingVisual : styles.leadingIcon,
        { backgroundColor: config.backgroundColor ?? tone.background }
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color ?? tone.text} />
    </View>
  );
}

export function ListTrailing({ config }: { config: ListTrailingConfig }) {
  if (config.type === "custom") {
    return <View style={styles.customTrailing}>{config.node}</View>;
  }
  if (config.type === "countdown") {
    return <CountdownTrailing config={config} />;
  }
  if (config.type === "radio") {
    return (
      <Ionicons
        name={config.selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={config.disabled ? colors.muted : config.selected ? colors.success : colors.muted}
      />
    );
  }
  if (config.type === "chevron") {
    return <Ionicons name="chevron-forward" size={18} color={colors.muted} />;
  }
  if (config.type === "status") {
    const tone = getToneColors(config.tone ?? "neutral");
    return (
      <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
        <Text style={[styles.statusText, { color: tone.text }]}>{config.label}</Text>
      </View>
    );
  }
  const tone = getToneColors(config.tone ?? "neutral");
  return (
    <View style={[styles.trailing, config.type === "amount" && styles.trailingAmount]}>
      <Text style={[config.type === "amount" ? styles.trailingValue : styles.trailingAction, { color: tone.text }]}>
        {config.type === "amount" ? config.value : config.label}
      </Text>
      {config.type === "amount" && config.meta ? <Text style={styles.trailingMeta}>{config.meta}</Text> : null}
    </View>
  );
}

function CountdownTrailing({
  config
}: {
  config: Extract<ListTrailingConfig, { type: "countdown" }>;
}) {
  const [now, setNow] = useState(Date.now());
  const active = config.active ?? true;
  const countdown = getCountdownPresentation(config.expiresAt, now);
  const topLabel = active ? countdown.label : config.inactiveLabel ?? countdown.label;
  const bottomTone = getToneColors(config.bottomTone ?? (active ? "success" : "neutral"));
  const alignToTwoRows = config.rowLines === 2 && Boolean(config.bottomLabel);

  useEffect(() => {
    if (!active || !countdown.showSeconds) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, countdown.showSeconds]);

  return (
    <View style={[styles.countdownTrailing, alignToTwoRows && styles.countdownTrailingTwoRows]}>
      <View
        style={[
          styles.countdownTop,
          alignToTwoRows && styles.countdownTopTwoRows,
          countdown.level === "critical" && styles.countdownCriticalPill
        ]}
      >
        <Text
          style={[
            styles.countdownText,
            alignToTwoRows && styles.countdownTextTwoRows,
            { color: countdown.color },
            countdown.level === "critical" && styles.countdownCriticalText,
            !active && styles.countdownInactiveText
          ]}
          numberOfLines={1}
        >
          {topLabel}
        </Text>
      </View>
      {config.bottomLabel ? (
        <Text
          style={[
            styles.countdownBottom,
            alignToTwoRows && styles.countdownBottomTwoRows,
            { color: bottomTone.text }
          ]}
          numberOfLines={1}
        >
          {config.bottomLabel}
        </Text>
      ) : null}
    </View>
  );
}

function getCountdownPresentation(expiresAt: number | string | undefined, now: number) {
  const expiryTime = getExpiryTime(expiresAt);
  if (!expiryTime) {
    return {
      label: "Expired",
      color: colors.muted,
      level: "inactive" as const,
      showSeconds: false
    };
  }

  const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
  if (remainingSeconds <= 0) {
    return {
      label: "Expired",
      color: colors.muted,
      level: "inactive" as const,
      showSeconds: false
    };
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  if (remainingSeconds > 24 * 60 * 60) {
    return {
      label: `${Math.ceil(remainingSeconds / (24 * 60 * 60))}d`,
      color: statusColors.success.text,
      level: "safe" as const,
      showSeconds: false
    };
  }

  const hourMinuteLabel = `${hours}h ${String(minutes).padStart(2, "0")}m`;
  const minuteSecondLabel = `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  const timeLabel = hours > 0 ? hourMinuteLabel : minuteSecondLabel;

  if (remainingSeconds < 2 * 60 * 60) {
    return {
      label: timeLabel,
      color: colors.onDark,
      level: "critical" as const,
      showSeconds: hours === 0
    };
  }
  if (remainingSeconds < 5 * 60 * 60) {
    return {
      label: timeLabel,
      color: statusColors.danger.text,
      level: "danger" as const,
      showSeconds: hours === 0
    };
  }
  return {
    label: timeLabel,
    color: statusColors.warning.text,
    level: "warning" as const,
    showSeconds: hours === 0
  };
}

function getExpiryTime(expiresAt: number | string | undefined) {
  if (typeof expiresAt === "number") {
    return expiresAt;
  }
  if (!expiresAt) {
    return undefined;
  }
  const parsed = new Date(expiresAt.includes("T") ? expiresAt : `${expiresAt}T23:59:59`).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getToneColors(tone: ListTone) {
  switch (tone) {
    case "success":
      return statusColors.success;
    case "warning":
      return statusColors.warning;
    case "danger":
      return statusColors.danger;
    case "info":
      return statusColors.info;
    case "exp":
      return assetColors.exp;
    case "points":
      return assetColors.points;
    case "rewardBonus":
      return assetColors.rewardBonus;
    case "voucher":
      return assetColors.voucher;
    case "coupon":
      return assetColors.coupon;
    case "neutral":
    default:
      return statusColors.neutral;
  }
}

const styles = StyleSheet.create({
  row: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  rowOneLine: {
    minHeight: 56
  },
  rowTwoLine: {
    minHeight: 74
  },
  rowThreeLine: {
    minHeight: 90
  },
  rowCompact: {
    minHeight: 64
  },
  rowContained: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  rowContainedOneLine: {
    minHeight: 62,
    paddingVertical: spacing.sm + 1
  },
  rowContainedTwoLine: {
    minHeight: 78,
    paddingVertical: spacing.md - 1
  },
  rowContainedThreeLine: {
    minHeight: 94,
    paddingVertical: spacing.md
  },
  rowContainedCompactOneLine: {
    minHeight: 54,
    paddingVertical: spacing.xs + 1
  },
  rowContainedCompactTwoLine: {
    minHeight: 64,
    paddingVertical: spacing.sm
  },
  rowContainedCompactThreeLine: {
    minHeight: 74,
    paddingVertical: spacing.sm
  },
  rowLast: {
    borderBottomWidth: 0
  },
  rowDisabled: {
    opacity: 0.58
  },
  leading: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radii.md
  },
  leadingIcon: {
    width: 44,
    height: 44
  },
  leadingVisual: {
    width: 62,
    height: 74
  },
  leadingVisualCompact: {
    width: 52,
    height: 56
  },
  visualImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  visualLabel: {
    position: "absolute",
    bottom: 7,
    color: colors.onDark,
    fontSize: 8,
    fontWeight: "700"
  },
  logoText: {
    fontSize: 14,
    fontWeight: "800"
  },
  logoImage: {
    width: "100%",
    height: "100%"
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs + 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    flex: 1,
    color: colors.ink,
    ...typography.button
  },
  primary: {
    color: colors.muted,
    ...typography.body
  },
  secondary: {
    color: colors.muted,
    ...typography.bodySmall,
    fontWeight: "400"
  },
  tertiary: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600"
  },
  trailing: {
    minWidth: 88,
    flexShrink: 0,
    alignItems: "flex-end"
  },
  customTrailing: {
    minWidth: 0,
    flexShrink: 0,
    alignItems: "flex-end"
  },
  trailingAmount: {
    minWidth: 104
  },
  countdownTrailing: {
    minWidth: 54,
    minHeight: 48,
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative"
  },
  countdownTrailingTwoRows: {
    minWidth: 88,
    minHeight: typography.button.lineHeight + spacing.xs + 1 + typography.body.lineHeight,
    justifyContent: "space-between"
  },
  countdownTop: {
    position: "relative",
    top: 0,
    right: 0,
    minHeight: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  countdownTopTwoRows: {
    position: "relative",
    top: 0,
    minHeight: typography.button.lineHeight,
    alignItems: "flex-end"
  },
  countdownText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "right"
  },
  countdownTextTwoRows: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: typography.button.lineHeight
  },
  countdownCriticalPill: {
    minHeight: 18,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: statusColors.danger.text
  },
  countdownCriticalText: {
    color: colors.onDark
  },
  countdownInactiveText: {
    color: colors.muted
  },
  countdownBottom: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "right"
  },
  countdownBottomTwoRows: {
    lineHeight: typography.body.lineHeight
  },
  trailingAction: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700"
  },
  trailingValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700"
  },
  trailingMeta: {
    color: colors.muted,
    ...typography.caption,
    marginTop: spacing.xs
  },
  statusPill: {
    minHeight: 22,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center"
  },
  statusText: {
    ...typography.caption,
    fontWeight: "800"
  }
});
