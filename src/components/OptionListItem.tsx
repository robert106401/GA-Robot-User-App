import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import {
  BaseListItem,
  ListLeadingConfig,
  ListTrailingConfig
} from "./ListItem";
import { colors, spacing, statusColors, typography } from "../theme";

type OptionIndicator = "radio" | "chevron" | "none";
type OptionDensity = "compact" | "summary" | "regular" | "rich";
type OptionVariant = "select" | "navigate" | "manage" | "valueSelect";
type OptionActionTone = "neutral" | "success" | "danger";
type OptionAction = {
  accessibilityLabel: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: OptionActionTone;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type OptionListItemProps = {
  leading?: ListLeadingConfig;
  title: string;
  text?: string;
  secondary?: string;
  rightMeta?: string;
  rightValue?: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: OptionVariant;
  indicator?: OptionIndicator;
  actions?: OptionAction[];
  trailing?: ListTrailingConfig;
  titleAccessory?: ReactNode;
  contained?: boolean;
  density?: OptionDensity;
  compact?: boolean;
  last?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function OptionListItem({
  leading,
  title,
  text,
  secondary,
  rightMeta,
  rightValue,
  selected = false,
  disabled = false,
  variant,
  indicator,
  actions,
  trailing,
  titleAccessory,
  contained = true,
  density,
  compact = false,
  last = false,
  onPress,
  style
}: OptionListItemProps) {
  const resolvedDensity = density ?? (compact ? "compact" : "regular");
  const resolvedIndicator = indicator ?? getVariantIndicator(variant);
  const resolvedActions = actions ?? getVariantActions({ variant, selected, title });

  return (
    <BaseListItem
      contained={contained}
      density={resolvedDensity === "compact" ? "compact" : "regular"}
      disabled={disabled}
      leading={leading}
      title={title}
      primary={text}
      secondary={secondary}
      titleAccessory={titleAccessory}
      trailing={trailing ?? getOptionTrailing({ indicator: resolvedIndicator, selected, disabled, rightMeta, rightValue, actions: resolvedActions })}
      last={last}
      onPress={onPress}
      style={[styles[resolvedDensity], style, selected && styles.selected, disabled && styles.disabled]}
    />
  );
}

function getVariantIndicator(variant?: OptionVariant): OptionIndicator {
  if (variant === "navigate") {
    return "chevron";
  }
  if (variant === "select" || variant === "manage" || variant === "valueSelect") {
    return "none";
  }
  return "radio";
}

function getVariantActions({
  variant,
  selected,
  title
}: {
  variant?: OptionVariant;
  selected: boolean;
  title: string;
}): OptionAction[] | undefined {
  if (variant !== "select" || !selected) {
    return undefined;
  }
  return [
    {
      icon: "checkmark-circle",
      selected: true,
      disabled: true,
      accessibilityLabel: `${title} selected`,
      onPress: () => {}
    }
  ];
}

function getOptionTrailing({
  indicator,
  selected,
  disabled,
  rightMeta,
  rightValue,
  actions
}: {
  indicator: OptionIndicator;
  selected: boolean;
  disabled: boolean;
  rightMeta?: string;
  rightValue?: string;
  actions?: OptionAction[];
}): ListTrailingConfig | undefined {
  const indicatorNode = getIndicatorNode(indicator, selected, disabled);

  if (!rightMeta && !rightValue && !actions?.length) {
    return indicatorNode;
  }

  return {
    type: "custom",
    node: (
      <View style={[
        styles.trailingGrid,
        !rightMeta && !rightValue && !indicatorNode && actions?.length ? styles.trailingGridActionsOnly : null
      ]}>
        {rightMeta ? (
          <View style={[styles.rightMetaPill, selected && styles.rightMetaPillSelected]}>
            <Text style={[styles.rightMetaText, selected && styles.rightMetaTextSelected]} numberOfLines={1}>
              {rightMeta}
            </Text>
          </View>
        ) : rightValue && indicatorNode ? (
          <View style={styles.rightMetaSpacer} />
        ) : null}
        {rightValue ? <Text style={styles.rightValue} numberOfLines={1}>{rightValue}</Text> : null}
        {indicatorNode ? <ListTrailingShim config={indicatorNode} /> : null}
        {actions?.length ? <OptionActions actions={actions} /> : null}
      </View>
    )
  };
}

function getIndicatorNode(
  indicator: OptionIndicator,
  selected: boolean,
  disabled: boolean
): ListTrailingConfig | undefined {
  if (indicator === "none") {
    return undefined;
  }
  if (indicator === "chevron") {
    return { type: "chevron" };
  }
  return { type: "radio", selected, disabled };
}

function ListTrailingShim({ config }: { config: ListTrailingConfig }) {
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
  return null;
}

function OptionActions({ actions }: { actions: OptionAction[] }) {
  return (
    <View style={styles.actions}>
      {actions.map((action, index) => {
        const tone = action.tone ?? (action.selected ? "success" : "neutral");
        return (
          <TouchableOpacity
            key={`${action.label ?? action.icon ?? "action"}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            disabled={action.disabled}
            activeOpacity={0.84}
            style={[
              styles.iconAction,
              action.selected && styles.selectedIndicator,
              action.selected && styles.iconActionSelected,
              action.disabled && styles.actionDisabled
            ]}
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              action.onPress();
            }}
          >
            {action.icon ? (
              <Ionicons
                name={getActionIcon(action)}
                size={action.selected ? 21 : 17}
                color={getActionColor(tone, action.selected)}
              />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getActionIcon(action: OptionAction) {
  if (action.selected && action.icon === "ellipse-outline") {
    return "checkmark-circle" as const;
  }
  return action.icon;
}

function getActionColor(tone: OptionActionTone, selected?: boolean) {
  if (tone === "danger") return colors.berry;
  if (tone === "success" || selected) return colors.success;
  return colors.coffee;
}

export function getOptionIconLeading({
  icon,
  selected,
  selectedColor = colors.success,
  selectedTextColor = colors.onDark,
  backgroundColor = colors.tint,
  color = colors.coffee
}: {
  icon: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  backgroundColor?: string;
  color?: string;
}): ListLeadingConfig {
  return {
    type: "icon",
    icon,
    backgroundColor: selected ? selectedColor : backgroundColor,
    color: selected ? selectedTextColor : color
  };
}

export function getOptionLogoLeading({
  label,
  selected,
  backgroundColor = colors.tint,
  color = colors.coffee,
  selectedColor = colors.success,
  selectedTextColor = colors.onDark
}: {
  label: string;
  selected?: boolean;
  backgroundColor?: string;
  color?: string;
  selectedColor?: string;
  selectedTextColor?: string;
}): ListLeadingConfig {
  return {
    type: "logo",
    label,
    backgroundColor: selected ? selectedColor : backgroundColor,
    color: selected ? selectedTextColor : color
  };
}

const styles = StyleSheet.create({
  compact: {
    minHeight: 62
  },
  summary: {
    minHeight: 74
  },
  regular: {
    minHeight: 82
  },
  rich: {
    minHeight: 104
  },
  selected: {
    borderColor: colors.success,
    borderTopColor: colors.success,
    borderRightColor: colors.success,
    borderBottomColor: colors.success,
    borderLeftColor: colors.success,
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    backgroundColor: statusColors.success.background
  },
  disabled: {
    opacity: 0.58
  },
  trailingGrid: {
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm + 1
  },
  trailingGridActionsOnly: {
    minWidth: 34
  },
  rightMetaSpacer: {
    width: 78
  },
  rightMetaPill: {
    width: 78,
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  rightMetaPillSelected: {
    backgroundColor: colors.surface,
    borderColor: statusColors.success.border
  },
  rightMetaText: {
    color: colors.coffee,
    fontSize: 9,
    fontWeight: "900"
  },
  rightMetaTextSelected: {
    color: colors.success
  },
  rightValue: {
    minWidth: 42,
    maxWidth: 86,
    textAlign: "right",
    color: colors.ink,
    ...typography.label,
    fontSize: 14,
    lineHeight: 18
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7
  },
  iconAction: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  iconActionSelected: {
    borderColor: "transparent",
    backgroundColor: "transparent"
  },
  selectedIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "transparent",
    borderWidth: 0
  },
  actionDisabled: {
    opacity: 0.48
  }
});
