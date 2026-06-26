import { ReactNode } from "react";
import { Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BaseListItem,
  ListLeadingConfig,
  ListTrailingConfig
} from "./ListItem";
import { SKU } from "../data/appData";
import { getSortedProductLabels, productLabelMeta } from "../productLabels";
import { getTierByExp } from "../tiers";
import { colors, getActiveTheme, radii, typography } from "../theme";
import { skuDetailVisualAssets } from "../visualAssets";

type ProductListItemProps = {
  sku?: SKU;
  xpBalance?: number;
  display?: "row" | "card";
  leading?: ListLeadingConfig;
  title?: string;
  primary?: string;
  secondary?: string;
  detail?: ReactNode;
  amount?: string;
  oldAmount?: string;
  quantityLabel?: string;
  contained?: boolean;
  density?: "regular" | "compact";
  last?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ProductListItem({
  sku,
  xpBalance = 0,
  display = "row",
  leading,
  title,
  primary,
  secondary,
  detail,
  amount,
  oldAmount,
  quantityLabel,
  contained = false,
  density = "regular",
  last = false,
  onPress,
  style
}: ProductListItemProps) {
  if (sku) {
    const currentTier = getTierByExp(xpBalance);
    const displayPrice = currentTier.memberPriceEligible ? sku.memberPrice : sku.price;
    const savings = currentTier.memberPriceEligible ? parseCurrency(sku.price) - parseCurrency(sku.memberPrice) : 0;
    const isOutOfStock = sku.stock === 0;
    const visual = getProductVisualMeta(sku);

    if (display === "card") {
      const theme = getActiveTheme();
      const cardContent = (
        <>
          <View style={styles.cardImageStage}>
            {!isOutOfStock ? (
              <Text style={styles.cardHeartCount} numberOfLines={1}>
                {sku.recentSales.toLocaleString("en-US")} ♥
              </Text>
            ) : null}
            {skuDetailVisualAssets[sku.id] ? (
              <Image source={skuDetailVisualAssets[sku.id]} style={styles.cardImage} resizeMode="contain" />
            ) : (
              <Ionicons name={visual.icon} size={34} color={colors.coffee} />
            )}
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle} numberOfLines={2}>{sku.name}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {sku.category} · {isOutOfStock ? "Out of Stock" : "Best Seller"}
            </Text>
            <ProductTags sku={sku} />
          </View>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardPrice}>{displayPrice}</Text>
              {currentTier.memberPriceEligible ? <Text style={styles.cardOldPrice}>{sku.price}</Text> : null}
            </View>
            {savings > 0 ? <Text style={styles.cardSavings}>Save ${savings.toFixed(2)}</Text> : null}
          </View>
        </>
      );

      const cardStyle = [
        styles.productCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.line },
        isOutOfStock ? styles.itemDisabled : undefined,
        style
      ];

      if (onPress) {
        return (
          <TouchableOpacity
            activeOpacity={0.84}
            accessibilityRole="button"
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
        leading={{
          type: "visual",
          image: skuDetailVisualAssets[sku.id],
          backgroundColor: "transparent",
          icon: visual.icon,
          color: visual.iconColor
        }}
        title={sku.name}
        primary={`${sku.category} · ${isOutOfStock ? "Out of Stock" : `${sku.recentSales} Recent Sales`}`}
        detail={<ProductTags sku={sku} />}
        trailing={getSkuTrailing({ displayPrice, originalPrice: currentTier.memberPriceEligible ? sku.price : undefined, savings })}
        lines={3}
        contained={contained}
        density={density}
        last={last}
        onPress={onPress}
        style={[isOutOfStock ? styles.itemDisabled : undefined, style]}
      />
    );
  }

  return (
      <BaseListItem
      leading={leading}
      title={title ?? ""}
      primary={primary}
      secondary={secondary}
      detail={detail}
      trailing={getProductTrailing({ amount, oldAmount, quantityLabel })}
      lines={detail ? 3 : undefined}
      contained={contained}
      density={density}
      last={last}
      onPress={onPress}
      style={style}
    />
  );
}

function ProductTags({ sku }: { sku: SKU }) {
  return (
    <View style={styles.tags}>
      {getSortedProductLabels(sku.labels)
        .slice(0, 2)
        .map((labelKey) => {
          const label = productLabelMeta[labelKey];

          return (
            <View key={labelKey} style={[styles.tag, { backgroundColor: label.tint }]}>
              <Ionicons name={label.icon} size={12} color={label.color} />
              <Text style={[styles.tagText, { color: label.color }]}>{label.label}</Text>
            </View>
          );
        })}
    </View>
  );
}

function getSkuTrailing({
  displayPrice,
  originalPrice,
  savings
}: {
  displayPrice: string;
  originalPrice?: string;
  savings: number;
}): ListTrailingConfig {
  return {
    type: "custom",
    node: (
      <View style={styles.priceBlock}>
        <Text style={styles.price}>{displayPrice}</Text>
        {originalPrice ? <Text style={styles.oldPrice}>{originalPrice}</Text> : null}
        {savings > 0 ? <Text style={styles.savings}>Save ${savings.toFixed(2)}</Text> : null}
      </View>
    )
  };
}

function getProductTrailing({
  amount,
  oldAmount,
  quantityLabel
}: {
  amount?: string;
  oldAmount?: string;
  quantityLabel?: string;
}): ListTrailingConfig | undefined {
  if (quantityLabel) {
    return { type: "status", label: quantityLabel, tone: "warning" };
  }
  if (!amount) {
    return undefined;
  }
  return {
    type: "custom",
    node: (
      <View style={styles.amountBlock}>
        <Text style={styles.amount}>{amount}</Text>
        {oldAmount ? <Text style={styles.oldAmount}>{oldAmount}</Text> : null}
      </View>
    )
  };
}

function getProductVisualMeta(sku: SKU): {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
} {
  switch (sku.category) {
    case "Coffee":
      return { icon: "cafe", iconColor: "#FFFFFF" };
    case "Milk Tea":
      return { icon: "beer", iconColor: "#FFFFFF" };
    case "Combo":
      return { icon: "albums", iconColor: "#FFFFFF" };
    case "Tea":
      return { icon: "leaf", iconColor: "#FFFFFF" };
    case "Functional Drink":
      return { icon: "fitness", iconColor: "#FFFFFF" };
    default:
      return { icon: "cafe", iconColor: "#FFFFFF" };
  }
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

const styles = StyleSheet.create({
  itemDisabled: {
    opacity: 0.72
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 1
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700"
  },
  productCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 8
  },
  cardImageStage: {
    height: 96,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  cardHeartCount: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
    color: colors.berry,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"]
  },
  cardImage: {
    width: "82%",
    height: "100%",
    marginLeft: -8
  },
  cardCopy: {
    gap: 4
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700"
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "400"
  },
  cardFooter: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8
  },
  cardPrice: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "800"
  },
  cardOldPrice: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
    textDecorationLine: "line-through"
  },
  cardSavings: {
    color: colors.success,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700"
  },
  amountBlock: {
    minWidth: 56,
    alignItems: "flex-end"
  },
  amount: {
    color: colors.ink,
    fontSize: typography.body.fontSize,
    fontWeight: "700"
  },
  oldAmount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textDecorationLine: "line-through"
  },
  priceBlock: {
    alignItems: "flex-end"
  },
  price: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  oldPrice: {
    color: colors.muted,
    fontSize: 12,
    textDecorationLine: "line-through"
  },
  savings: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5
  }
});
