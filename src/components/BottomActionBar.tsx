import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, controlSizes, radii, spacing, typography } from "../theme";

type BottomActionBarProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  notice?: string;
}>;

type BottomActionButtonProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "wallet";
  style?: StyleProp<ViewStyle>;
};

type BottomActionSummaryProps = {
  label: string;
  value: string;
  meta?: string;
};

export function BottomActionBar({ children, style, notice }: BottomActionBarProps) {
  return (
    <View style={[styles.bar, style]}>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <View style={styles.actionRow}>{children}</View>
    </View>
  );
}

export function BottomActionSummary({ label, value, meta }: BottomActionSummaryProps) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      {meta ? <Text style={styles.summaryMeta}>{meta}</Text> : null}
    </View>
  );
}

export function BottomActionButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style
}: BottomActionButtonProps) {
  const isSecondary = variant === "secondary";
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      activeOpacity={0.84}
      style={[
        styles.button,
        variant === "wallet" && styles.walletButton,
        isSecondary && styles.secondaryButton,
        (disabled || loading) && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isSecondary ? colors.ink : colors.onDark} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={isSecondary ? colors.ink : colors.onDark} />
      ) : null}
      <Text style={[styles.buttonText, isSecondary && styles.secondaryButtonText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: controlSizes.bottomActionBar,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm + spacing.xxs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  notice: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
    marginBottom: spacing.sm
  },
  actionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  summary: {
    flex: 1
  },
  summaryLabel: {
    color: colors.muted,
    ...typography.bodySmall
  },
  summaryValue: {
    color: colors.ink,
    ...typography.value,
    marginTop: spacing.xs - 1
  },
  summaryMeta: {
    color: colors.success,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: typography.button.fontWeight,
    marginTop: spacing.xs - 1
  },
  button: {
    minHeight: controlSizes.primaryButton,
    minWidth: 132,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  walletButton: {
    backgroundColor: colors.success
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  buttonDisabled: {
    opacity: 0.45
  },
  buttonText: {
    color: colors.onDark,
    ...typography.button
  },
  secondaryButtonText: {
    color: colors.ink
  }
});
