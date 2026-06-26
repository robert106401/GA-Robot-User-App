import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, controlSizes, spacing, typography } from "../theme";

type NavigationBackButtonProps = {
  label?: string;
  onPress: () => void;
  placement?: "block" | "header";
};

export function NavigationBackButton({ label = "Back", onPress, placement = "block" }: NavigationBackButtonProps) {
  const isHeader = placement === "header";
  const displayLabel = formatBackDisplayLabel(label);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label === "Back" ? "Back" : `Back to ${displayLabel}`}
      activeOpacity={0.82}
      style={[styles.button, isHeader && styles.headerButton]}
      onPress={onPress}
    >
      <Ionicons name="chevron-back" size={isHeader ? 19 : 20} color={colors.ink} />
      <Text style={[styles.label, isHeader && styles.headerLabel]} numberOfLines={1}>{displayLabel}</Text>
    </TouchableOpacity>
  );
}

function formatBackDisplayLabel(label: string) {
  return label.replace(/^Back to\s+/i, "");
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    minHeight: controlSizes.backButton,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  label: {
    color: colors.ink,
    ...typography.label
  },
  headerButton: {
    alignSelf: "auto",
    maxWidth: 148,
    minHeight: 36,
    marginBottom: 0,
    paddingHorizontal: 0
  },
  headerLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700"
  }
});
