import { Image, ImageStyle, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { assetColors, colors, getActiveTheme, radii } from "../theme";
import { BaseListItem, ListLeading, ListLeadingConfig } from "./ListItem";
import type { ProductDisplayMode } from "../state/appState";

type OpportunityValueTone = "coupon" | "success" | "neutral";
type OpportunityDensity = "regular" | "compact";

type OpportunityListItemProps = {
  leading: ListLeadingConfig;
  title: string;
  offer: string;
  meta?: string;
  valueLabel: string;
  valueMeta?: string;
  valueTone?: OpportunityValueTone;
  valueColor?: string;
  display?: ProductDisplayMode;
  density?: OpportunityDensity;
  disabled?: boolean;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function OpportunityListItem({
  leading,
  title,
  offer,
  meta,
  valueLabel,
  valueMeta,
  valueTone = "coupon",
  valueColor,
  display = "row",
  density = "regular",
  disabled = false,
  last = false,
  style,
  onPress
}: OpportunityListItemProps) {
  const tone = getValueTone(valueTone);

  if (display === "card") {
    const theme = getActiveTheme();
    const cardContent = (
      <>
        <View style={styles.cardHeader}>
          <OpportunityCardLogo leading={leading} />
          <View style={styles.cardValueBlock}>
            {valueMeta ? <Text style={styles.cardValueMeta} numberOfLines={1}>{valueMeta}</Text> : null}
            <Text style={[styles.cardValue, { color: valueColor ?? tone.text }]} numberOfLines={1}>
              {valueLabel}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardOffer}>{offer}</Text>
          <Text style={styles.cardSecondary} numberOfLines={2}>{title}</Text>
        </View>
        {meta ? <Text style={styles.cardMeta} numberOfLines={1}>{meta}</Text> : null}
      </>
    );
    const cardStyle = [
      styles.card,
      { backgroundColor: theme.colors.surface, borderColor: theme.colors.line },
      disabled && styles.cardDisabled,
      style
    ];

    if (onPress) {
      return (
        <TouchableOpacity
          activeOpacity={0.84}
          accessibilityRole="button"
          disabled={disabled}
          style={cardStyle}
          onPress={onPress}
        >
          {cardContent}
        </TouchableOpacity>
      );
    }

    return <View style={cardStyle}>{cardContent}</View>;
  }

  return (
    <BaseListItem
      contained
      disabled={disabled}
      leading={leading}
      title={title}
      primary={offer}
      primaryTextStyle={styles.offerLine}
      secondary={meta}
      trailing={{
        type: "custom",
        node: (
          <View
            style={styles.valueBlock}
            accessibilityLabel={valueLabel}
          >
            <Text style={[styles.valueText, { color: valueColor ?? tone.text }]} numberOfLines={1}>
              {valueLabel}
            </Text>
          </View>
        )
      }}
      density={density}
      last={last}
      onPress={onPress}
      style={style}
    />
  );
}

function OpportunityCardLogo({ leading }: { leading: ListLeadingConfig }) {
  if (leading.type === "logo" && leading.image) {
    return (
      <View style={[styles.cardLogo, { backgroundColor: leading.backgroundColor }]}>
        <Image source={leading.image} style={styles.cardLogoImage as ImageStyle} resizeMode="contain" />
      </View>
    );
  }
  if (leading.type === "logo") {
    return (
      <View style={[styles.cardLogo, { backgroundColor: leading.backgroundColor }]}>
        <Text style={[styles.cardLogoText, { color: leading.color }]} numberOfLines={1}>{leading.label}</Text>
      </View>
    );
  }
  if (leading.type !== "none") {
    return <ListLeading config={leading} />;
  }
  return null;
}

function getValueTone(tone: OpportunityValueTone) {
  if (tone === "success") {
    return {
      text: colors.success,
      background: "#FFFFFF",
      border: colors.success
    };
  }
  if (tone === "neutral") {
    return {
      text: colors.muted,
      background: colors.surface,
      border: colors.line
    };
  }
  return assetColors.coupon;
}

const styles = StyleSheet.create({
  valueBlock: {
    minWidth: 62,
    minHeight: 34,
    alignItems: "flex-end",
    justifyContent: "center"
  },
  valueText: {
    maxWidth: 74,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"]
  },
  offerLine: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500"
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
    gap: 9
  },
  cardDisabled: {
    opacity: 0.64
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  cardLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  cardLogoImage: {
    width: "100%",
    height: "100%"
  },
  cardLogoText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "800"
  },
  cardValue: {
    maxWidth: 82,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"]
  },
  cardValueBlock: {
    minWidth: 56,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5
  },
  cardValueMeta: {
    maxWidth: 82,
    color: colors.berry,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"]
  },
  cardBody: {
    marginTop: 9,
    minHeight: 53,
    gap: 1
  },
  cardOffer: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700"
  },
  cardSecondary: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "400"
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500"
  }
});
