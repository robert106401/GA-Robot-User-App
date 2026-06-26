import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme";

export type FilterPillOption<T extends string> = {
  value: T;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
};

type FilterPillsProps<T extends string> = {
  options: readonly FilterPillOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
};

export function FilterPills<T extends string>({
  options,
  activeValue,
  onChange
}: FilterPillsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = activeValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            activeOpacity={0.82}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(option.value)}
          >
            {option.icon ? (
              <Ionicons name={option.icon} size={14} color={active ? colors.onDark : colors.muted} />
            ) : null}
            <Text style={[styles.label, active && styles.labelActive]}>{option.label ?? option.value}</Text>
            {typeof option.count === "number" ? (
              <Text style={[styles.count, active && styles.countActive]}>{option.count}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.xl - spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  pill: {
    minHeight: 34,
    paddingHorizontal: spacing.sm + spacing.xxs,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 1,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  pillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  label: {
    color: colors.muted,
    fontSize: typography.bodySmall.fontSize - 1,
    fontWeight: typography.button.fontWeight
  },
  labelActive: {
    color: colors.onDark
  },
  count: {
    color: colors.muted,
    ...typography.caption
  },
  countActive: {
    color: colors.milk
  }
});
