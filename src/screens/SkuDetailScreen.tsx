import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton } from "../components/BottomActionBar";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { SkuCustomizationGroup, skus } from "../data/appData";
import { getSortedProductLabels, productLabelMeta } from "../productLabels";
import { getTierByExp } from "../tiers";
import { colors } from "../theme";
import { AppToastMessage } from "../feedback";
import { CartItem, SkuCustomizationSelection } from "../types";
import { skuDetailVisualAssets } from "../visualAssets";

type SkuDetailScreenProps = {
  skuId: string;
  cartCount: number;
  isFavorite: boolean;
  onToggleFavorite: (skuId: string) => void;
  onAddToCart: (item: CartItem) => void;
  onOpenCart: () => void;
  onBuyNow: (item: CartItem) => void;
  onBack: () => void;
  xpBalance: number;
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
};

export function SkuDetailScreen({
  skuId,
  cartCount,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onOpenCart,
  onBuyNow,
  onBack,
  xpBalance,
  onShowToast
}: SkuDetailScreenProps) {
  const sku = skus.find((item) => item.id === skuId) ?? skus[0];
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SkuCustomizationSelection>(() => getDefaultOptions(sku));
  const visibleCustomizationGroups = sku.customizationGroups.filter((group) => isGroupVisible(group, selectedOptions));
  const currentTier = getTierByExp(xpBalance);
  const effectivePrice = currentTier.memberPriceEligible ? sku.memberPrice : sku.price;

  const total = parseCurrency(effectivePrice) * quantity;
  const savings = currentTier.memberPriceEligible ? parseCurrency(sku.price) - parseCurrency(sku.memberPrice) : 0;
  const customizationSummary = formatCustomizationSummary(visibleCustomizationGroups, selectedOptions);

  useEffect(() => {
    setQuantity(1);
    setSelectedOptions(getDefaultOptions(sku));
  }, [sku.id]);

  return (
    <Screen
      title={sku.name}
      eyebrow="Product detail"
      scrollKey={`sku-detail-${sku.id}`}
      onBack={onBack}
      bottomAction={
        <BottomActionBar>
          <BottomActionButton
            label={sku.stock === 0 ? "Out of Stock" : "Add to Cart"}
            icon="cart-outline"
            variant="secondary"
            style={styles.bottomActionButton}
            disabled={sku.stock === 0}
            onPress={() => {
              onAddToCart({ skuId: sku.id, quantity, customizationSummary });
              onShowToast({
                tone: "success",
                title: "Added to cart",
                message: `${quantity} item${quantity > 1 ? "s" : ""} · ${sku.name}`,
                icon: "cart-outline",
                actionLabel: "View Cart",
                onAction: onOpenCart
              });
            }}
          />
          <BottomActionButton
            label={sku.stock === 0 ? "Unavailable" : "Buy Now"}
            icon="flash-outline"
            style={styles.bottomActionButton}
            disabled={sku.stock === 0}
            onPress={() => onBuyNow({ skuId: sku.id, quantity, customizationSummary })}
          />
        </BottomActionBar>
      }
      trailing={
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Open cart, ${cartCount} items`}
            style={styles.cartButton}
            onPress={onOpenCart}
            activeOpacity={0.84}
          >
            <Ionicons name="cart-outline" size={19} color={colors.ink} />
            <Text style={styles.cartButtonText}>{cartCount}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.heroFrame}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroSignals}>
            {getSortedProductLabels(sku.labels)
              .slice(0, 2)
              .map((labelKey) => {
                const label = productLabelMeta[labelKey];

                return (
                  <View key={labelKey} style={[styles.heroSignalPill, { backgroundColor: label.tint }]}>
                    <Ionicons name={label.icon} size={14} color={label.color} />
                    <Text style={[styles.heroSignalText, { color: label.color }]}>{label.label}</Text>
                  </View>
                );
              })}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={() => onToggleFavorite(sku.id)}
            activeOpacity={0.84}
          >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={21} color={isFavorite ? colors.berry : colors.ink} />
          </TouchableOpacity>
        </View>
        <View style={styles.productHero}>
          {skuDetailVisualAssets[sku.id] ? (
            <Image source={skuDetailVisualAssets[sku.id]} style={styles.productHeroImage} resizeMode="contain" />
          ) : (
            <>
              <View style={styles.cupBody} />
              <View style={styles.cupLid} />
            </>
          )}
        </View>
      </View>

      <AppCard style={styles.priceCard}>
        <View>
          <Text style={styles.priceLabel}>{currentTier.memberPriceEligible ? "Member price" : "Price"}</Text>
          <Text style={styles.memberPrice}>{effectivePrice}</Text>
        </View>
        <View style={styles.priceRight}>
          {currentTier.memberPriceEligible ? <Text style={styles.oldPrice}>{sku.price}</Text> : null}
          {savings > 0 ? (
            <View style={styles.savingsPill}>
              <Ionicons name="pricetag-outline" size={13} color="#FFFFFF" />
              <Text style={styles.savingsText}>Save ${savings.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>
      </AppCard>

      <SectionHeader title="Customize" />
      <AppCard style={styles.customizeCard}>
        {visibleCustomizationGroups.map((group) => {
          return (
            <View key={group.id} style={styles.optionGroup}>
              <Text style={styles.optionTitle}>{group.title}</Text>
              <View style={styles.optionRow}>
                {group.options.map((option) => {
                  const isSelected = selectedOptions[group.id] === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      activeOpacity={0.84}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected
                      ]}
                      onPress={() => {
                        setSelectedOptions((current) => ({
                          ...current,
                          [group.id]: option
                        }));
                      }}
                    >
                      <Text
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.68}
                      >
                        {formatCustomizeOptionLabel(option)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </AppCard>

      <SectionHeader title="Quantity" />
      <AppCard style={styles.quantityCard}>
        <TouchableOpacity
          style={[styles.stepperButton, quantity === 1 && styles.stepperButtonDisabled]}
          disabled={quantity === 1}
          onPress={() => setQuantity((value) => Math.max(1, value - 1))}
        >
          <Ionicons name="remove" size={20} color={quantity === 1 ? colors.muted : colors.ink} />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantity}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => setQuantity((value) => Math.min(sku.stock, value + 1))}
        >
          <Ionicons name="add" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </AppCard>

    </Screen>
  );
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function getDefaultOptions(sku: (typeof skus)[number]) {
  return sku.customizationGroups.reduce<SkuCustomizationSelection>((selection, group) => {
    selection[group.id] = group.options[0];
    return selection;
  }, {});
}

function isGroupVisible(group: SkuCustomizationGroup, selectedOptions: SkuCustomizationSelection) {
  if (!group.visibleWhen) {
    return true;
  }

  return group.visibleWhen.values.includes(selectedOptions[group.visibleWhen.groupId]);
}

function formatCustomizationSummary(groups: SkuCustomizationGroup[], selectedOptions: SkuCustomizationSelection) {
  const entries = groups
    .map((group) => ({ title: group.title, value: selectedOptions[group.id] }))
    .filter((entry) => Boolean(entry.value));
  const repeatedValues = entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.value] = (counts[entry.value] ?? 0) + 1;
    return counts;
  }, {});

  return entries
    .map((entry) => repeatedValues[entry.value] > 1 ? `${entry.title}: ${entry.value}` : entry.value)
    .join(" · ");
}

function formatCustomizeOptionLabel(option: string) {
  return option.replace(/\s+(Ice|Milk)$/i, "");
}

const styles = StyleSheet.create({
  bottomActionButton: {
    flex: 1,
    minWidth: 0
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  cartButton: {
    minHeight: 42,
    minWidth: 58,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  cartButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  favoriteButtonActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: colors.berry
  },
  heroFrame: {
    position: "relative"
  },
  heroOverlay: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  productHero: {
    width: "100%",
    aspectRatio: 1.35,
    alignItems: "center",
    justifyContent: "center"
  },
  productHeroImage: {
    width: "86%",
    height: "92%"
  },
  heroSignals: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
    flex: 1,
    paddingRight: 10
  },
  heroSignalPill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  heroSignalText: {
    fontSize: 11,
    fontWeight: "700"
  },
  cupBody: {
    width: 82,
    height: 106,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.78)"
  },
  cupLid: {
    position: "absolute",
    top: 72,
    width: 108,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.92)"
  },
  priceCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  priceLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  memberPrice: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4
  },
  priceRight: {
    alignItems: "flex-end"
  },
  oldPrice: {
    color: colors.muted,
    fontSize: 14,
    textDecorationLine: "line-through",
    fontWeight: "700"
  },
  savingsPill: {
    minHeight: 28,
    marginTop: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.success
  },
  savingsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  },
  customizeCard: {
    gap: 16
  },
  optionGroup: {
    gap: 9
  },
  optionTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700"
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 7,
    width: "100%"
  },
  optionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  optionButtonSelected: {
    backgroundColor: colors.coffee,
    borderColor: colors.coffee,
    borderWidth: 1
  },
  optionText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    textAlign: "center"
  },
  optionTextSelected: {
    color: colors.onDark,
    fontWeight: "700"
  },
  quantityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  stepperButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  stepperButtonDisabled: {
    opacity: 0.45
  },
  quantity: {
    minWidth: 28,
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  totalBlock: {
    flex: 1,
    alignItems: "flex-end"
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  totalValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4
  },
  purchaseActions: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10
  },
  addButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  addButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  buyButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  }
});
