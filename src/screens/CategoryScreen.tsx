import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionTile } from "../components/ActionTile";
import { ProductListItem } from "../components/ProductListItem";
import { Screen } from "../components/Screen";
import { skus } from "../data/appData";
import { hasProductLabelGroup } from "../productLabels";
import { colors } from "../theme";
import type { ProductDisplayMode } from "../state/appState";

type OrderCategory = "Popular" | "Favorites" | "Healthy" | "Coffee" | "Milk Tea" | "Combo";

const categories: OrderCategory[] = ["Popular", "Favorites", "Healthy", "Coffee", "Milk Tea", "Combo"];

type CategoryScreenProps = {
  onOpenSku: (skuId: string) => void;
  onOpenCart: () => void;
  cartCount: number;
  favoriteSkuIds: string[];
  xpBalance: number;
  productDisplayMode: ProductDisplayMode;
};

export function CategoryScreen({
  onOpenSku,
  onOpenCart,
  cartCount,
  favoriteSkuIds,
  xpBalance,
  productDisplayMode
}: CategoryScreenProps) {
  const [activeCategory, setActiveCategory] = useState<OrderCategory | null>(null);
  const categoryCounts = useMemo(
    () =>
      categories.reduce<Record<OrderCategory, number>>(
        (counts, category) => ({
          ...counts,
          [category]: getSkusForCategory(category, favoriteSkuIds).length
        }),
        {
          Popular: 0,
          Favorites: 0,
          Coffee: 0,
          "Milk Tea": 0,
          Combo: 0,
          Healthy: 0
        }
      ),
    [favoriteSkuIds]
  );
  const visibleSkus = useMemo(() => {
    return activeCategory ? getSkusForCategory(activeCategory, favoriteSkuIds) : skus;
  }, [activeCategory, favoriteSkuIds]);

  return (
    <Screen
      title="Order"
      eyebrow="Browse drinks"
      scrollKey="order"
      trailing={
        <TouchableOpacity
          style={styles.cartButton}
          onPress={onOpenCart}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel={`Open cart, ${cartCount} items`}
        >
          <Ionicons name="cart-outline" size={22} color={colors.blue} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      }
    >
      <View style={styles.segmented}>
        {categories.map((category) => {
          const active = activeCategory === category;
          const meta = getCategoryMeta(category);

          return (
            <ActionTile
              key={category}
              icon={meta.icon}
              iconColor={meta.color}
              label={meta.label}
              badge={categoryCounts[category]}
              selected={active}
              columns={3}
              compact
              layout="segment"
              style={styles.segment}
              onPress={() => setActiveCategory(active ? null : category)}
            />
          );
        })}
      </View>

      <View style={styles.listHeader}>
        <View style={styles.listTitleRow}>
          <Text style={styles.listTitle}>{activeCategory ? `${activeCategory} Menu` : "All Menu"}</Text>
          <View style={styles.listCountPill}>
            <Text style={styles.listCountText}>{visibleSkus.length}</Text>
          </View>
        </View>
      </View>
      {visibleSkus.length > 0 ? (
        <View style={productDisplayMode === "card" ? styles.productCardGrid : styles.menuList}>
          {visibleSkus.map((sku) => (
            <ProductListItem
              key={sku.id}
              contained
              sku={sku}
              xpBalance={xpBalance}
              display={productDisplayMode}
              style={productDisplayMode === "card" ? styles.productCardGridItem : undefined}
              onPress={() => onOpenSku(sku.id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyFavorites}>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>Tap the heart on any product detail page to save it here.</Text>
        </View>
      )}
    </Screen>
  );
}

function getSkusForCategory(category: OrderCategory, favoriteSkuIds: string[]) {
  if (category === "Popular") {
    return skus
      .filter((sku) => hasProductLabelGroup(sku.labels, "popular"))
      .sort((a, b) => b.recentSales - a.recentSales);
  }
  if (category === "Favorites") {
    return skus.filter((sku) => favoriteSkuIds.includes(sku.id));
  }
  if (category === "Healthy") {
    return skus.filter(isHealthySku);
  }
  return skus.filter((sku) => sku.category === category);
}

function isHealthySku(sku: (typeof skus)[number]) {
  return hasProductLabelGroup(sku.labels, "healthy");
}

function getCategoryMeta(category: OrderCategory): {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
} {
  switch (category) {
    case "Popular":
      return { icon: "flame-outline", label: "Popular", color: colors.warning };
    case "Favorites":
      return { icon: "heart-outline", label: "Favorite", color: colors.berry };
    case "Coffee":
      return { icon: "cafe-outline", label: "Coffee", color: colors.coffee };
    case "Milk Tea":
      return { icon: "water-outline", label: "Milk Tea", color: colors.milk };
    case "Combo":
      return { icon: "albums-outline", label: "Combo", color: colors.blue };
    case "Healthy":
      return { icon: "leaf-outline", label: "Healthy", color: colors.success };
    default:
      return { icon: "pricetag-outline", label: category, color: colors.coffee };
  }
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 9
  },
  segment: {
    width: "31.9%",
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative"
  },
  segmentActive: {
    backgroundColor: colors.ink
  },
  segmentIcon: {
    position: "absolute",
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  segmentIconActive: {
    backgroundColor: colors.surface
  },
  segmentText: {
    flex: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  segmentCount: {
    position: "absolute",
    right: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  segmentCountActive: {
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  segmentCountText: {
    color: colors.coffee,
    fontSize: 11,
    fontWeight: "700"
  },
  segmentCountTextActive: {
    color: "#FFFFFF"
  },
  listHeader: {
    minHeight: 44,
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  listTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  listCountPill: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  listCountText: {
    color: colors.coffee,
    fontSize: 12,
    fontWeight: "700"
  },
  menuList: {
    gap: 10
  },
  productCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  productCardGridItem: {
    flexBasis: "48%"
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative"
  },
  cartBadge: {
    position: "absolute",
    top: -3,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.berry,
    borderColor: colors.surface,
    borderWidth: 1.5
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700"
  },
  emptyFavorites: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center"
  }
});
