import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { BaseListItem } from "../components/ListItem";
import { Screen } from "../components/Screen";
import { skus } from "../data/appData";
import { getTierByExp } from "../tiers";
import { colors, radii, spacing, statusColors, typography } from "../theme";
import { AppToastMessage } from "../feedback";
import { CartItem } from "../types";

type CartScreenProps = {
  cartItems: Record<string, CartItem>;
  onRemoveItem: (cartKey: string) => void;
  onCheckout: (items: CartItem[]) => void;
  onBack: () => void;
  xpBalance: number;
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
};

export function CartScreen({ cartItems, onRemoveItem, onCheckout, onBack, xpBalance, onShowToast }: CartScreenProps) {
  const [selectedCartKeys, setSelectedCartKeys] = useState<string[]>([]);
  const items = Object.entries(cartItems)
    .map(([cartKey, cartItem]) => {
      const sku = skus.find((item) => item.id === cartItem.skuId);
      return sku ? { cartKey, sku, quantity: cartItem.quantity, customizationSummary: cartItem.customizationSummary } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const cartKeys = items.map((item) => item.cartKey);
  const selectedItems = items.filter((item) => selectedCartKeys.includes(item.cartKey));
  const selectedItemCount = selectedItems.length;
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected = items.length > 0 && selectedItemCount === items.length;
  const currentTier = getTierByExp(xpBalance);
  const total = selectedItems.reduce(
    (sum, item) => sum + parseCurrency(currentTier.memberPriceEligible ? item.sku.memberPrice : item.sku.price) * item.quantity,
    0
  );

  useEffect(() => {
    setSelectedCartKeys((keys) => {
      const validKeys = keys.filter((key) => cartKeys.includes(key));
      const newKeys = cartKeys.filter((key) => !validKeys.includes(key));
      return [...validKeys, ...newKeys];
    });
  }, [cartKeys.join("|")]);

  function toggleCartItem(cartKey: string) {
    setSelectedCartKeys((keys) => (keys.includes(cartKey) ? keys.filter((key) => key !== cartKey) : [...keys, cartKey]));
  }

  function toggleAllItems() {
    setSelectedCartKeys(allSelected ? [] : cartKeys);
  }

  return (
    <Screen
      title="Cart"
      eyebrow={`${selectedItemCount}/${items.length} selected`}
      scrollKey="cart"
      onBack={onBack}
      bottomAction={
        items.length > 0 ? (
          <BottomActionBar>
            <BottomActionSummary
              label="Selected Total"
              value={`$${total.toFixed(2)}`}
              meta={`${selectedQuantity} item${selectedQuantity > 1 ? "s" : ""}`}
            />
            <BottomActionButton
              label="Checkout"
              icon="arrow-forward"
              disabled={selectedItems.length === 0}
              onPress={() =>
                onCheckout(
                  selectedItems.map((selectedItem) => ({
                    skuId: selectedItem.sku.id,
                    quantity: selectedItem.quantity,
                    customizationSummary: selectedItem.customizationSummary
                  }))
                )
              }
            />
          </BottomActionBar>
        ) : null
      }
    >
        {items.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={34} color={colors.muted} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Add a best seller from Home to start checkout.</Text>
          </AppCard>
        ) : (
          <>
            <TouchableOpacity style={styles.selectAllRow} onPress={toggleAllItems}>
              <View style={[styles.checkBox, allSelected && styles.checkBoxSelected]}>
                {allSelected ? <Ionicons name="checkmark" size={16} color={colors.onDark} /> : null}
              </View>
              <Text style={styles.selectAllText}>{allSelected ? "All selected" : "Select all"}</Text>
              <Text style={styles.selectAllMeta}>{selectedQuantity} item{selectedQuantity > 1 ? "s" : ""} to pay</Text>
            </TouchableOpacity>

            <View style={styles.cartList}>
              {items.map(({ cartKey, sku, quantity, customizationSummary }) => (
                <BaseListItem
                  key={cartKey}
                  contained
                  style={!selectedCartKeys.includes(cartKey) && styles.cartRowMuted}
                  leading={{
                    type: "custom",
                    node: (
                      <View style={styles.cartLeading}>
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selectedCartKeys.includes(cartKey) }}
                          style={[styles.checkBox, selectedCartKeys.includes(cartKey) && styles.checkBoxSelected]}
                          onPress={() => toggleCartItem(cartKey)}
                        >
                          {selectedCartKeys.includes(cartKey) ? <Ionicons name="checkmark" size={16} color={colors.onDark} /> : null}
                        </TouchableOpacity>
                        <View style={[styles.skuVisual, { backgroundColor: sku.color }]} />
                      </View>
                    )
                  }}
                  title={sku.name}
                  primary={`${sku.category} · Qty ${quantity} · ${currentTier.memberPriceEligible ? sku.memberPrice : sku.price} each`}
                  detail={
                    <View style={styles.customizationBox}>
                      <Ionicons name="options-outline" size={14} color={colors.coffee} />
                      <Text style={styles.customizationMeta}>{customizationSummary}</Text>
                    </View>
                  }
                  lines={3}
                  trailing={{
                    type: "custom",
                    node: (
                      <View style={styles.cartTrailing}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${sku.name} from cart`}
                          style={styles.removeButton}
                          onPress={() => {
                            onRemoveItem(cartKey);
                            setSelectedCartKeys((keys) => keys.filter((key) => key !== cartKey));
                            onShowToast({
                              tone: "info",
                              title: "Removed from cart",
                              message: sku.name,
                              icon: "trash-outline"
                            });
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.berry} />
                        </TouchableOpacity>
                        <View style={styles.priceBlock}>
                          <Text style={styles.unitPrice}>Line total</Text>
                          <Text style={styles.lineTotal}>
                            ${(parseCurrency(currentTier.memberPriceEligible ? sku.memberPrice : sku.price) * quantity).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )
                  }}
                  onPress={() => toggleCartItem(cartKey)}
                />
              ))}
            </View>
          </>
        )}
    </Screen>
  );
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

const styles = StyleSheet.create({
  emptyCard: {
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.button.fontWeight,
    marginTop: spacing.md
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center"
  },
  selectAllRow: {
    minHeight: 48,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  selectAllText: {
    color: colors.ink,
    fontSize: typography.label.fontSize,
    fontWeight: typography.button.fontWeight
  },
  selectAllMeta: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right"
  },
  cartList: {
    gap: 10
  },
  cartLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  cartTrailing: {
    alignItems: "flex-end",
    gap: 8
  },
  cartRowMuted: {
    opacity: 0.58
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderWidth: 1
  },
  checkBoxSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  skuVisual: {
    width: 44,
    height: 48,
    borderRadius: 8
  },
  customizationMeta: {
    color: colors.coffee,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17
  },
  customizationBox: {
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.tint
  },
  priceBlock: {
    minWidth: 88,
    alignItems: "flex-end"
  },
  lineTotal: {
    color: colors.ink,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.button.fontWeight,
    marginTop: 2
  },
  unitPrice: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.danger.subtleBackground,
    borderColor: statusColors.danger.border,
    borderWidth: StyleSheet.hairlineWidth
  },
});
