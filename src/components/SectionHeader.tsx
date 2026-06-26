import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../theme";

type SectionHeaderProps = {
  title: string;
  action?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, action, onActionPress, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        onActionPress ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${action} ${title}`}
            activeOpacity={0.72}
            style={styles.actionButton}
            onPress={onActionPress}
          >
            <Text style={styles.action}>{action}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.action}>{action}</Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.section,
    marginBottom: spacing.sm + spacing.xxs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    color: colors.ink,
    ...typography.sectionTitle
  },
  action: {
    color: colors.coffee,
    ...typography.body
  },
  actionButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center"
  }
});
