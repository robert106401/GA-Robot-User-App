import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionTile } from "../components/ActionTile";
import { AppCard } from "../components/AppCard";
import { OpportunityListItem } from "../components/OpportunityListItem";
import { ProductListItem } from "../components/ProductListItem";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { campaigns, coupons, partnerOffers, skus, vendingMachines, vouchers } from "../data/appData";
import { productCopy } from "../productCopy";
import { partnerOfferLogos } from "../partnerOfferLogos";
import { getPartnerOfferValueLabel } from "../partnerOfferPresentation";
import { colors } from "../theme";
import { OrderRecord, PartnerOfferPurchaseRecord, RedeemedPointReward } from "../types";
import type { ProductDisplayMode } from "../state/appState";

export type ImmediateActionItem = {
  id: string;
  kind: "prepaid" | "partnerOffer" | "voucher" | "coupon" | "wallet";
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  primary: string;
  expiresAt?: number | string;
  valueLabel?: string;
  referenceLabel?: string;
  bottomLabel?: string;
  onPress: () => void;
};

type HomeScreenProps = {
  userName: string;
  onOpenSku: (skuId: string) => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenCoupons: () => void;
  onOpenPartnerOffers: (offerId?: string) => void;
  onOpenTopUp: () => void;
  onOpenGift: () => void;
  onOpenMissions: () => void;
  onOpenMap: () => void;
  claimedCouponIds: string[];
  usedBenefitIds: string[];
  onClaimCoupon: (couponId: string) => void;
  onViewAllProducts: () => void;
  pendingOrders: OrderRecord[];
  purchasedPartnerOffers: PartnerOfferPurchaseRecord[];
  redeemedPointRewards: RedeemedPointReward[];
  onOpenOrder: (orderId: string) => void;
  onOpenPartnerVoucher: (voucherCode: string) => void;
  onOpenVoucher: (voucherId: string) => void;
  onOpenPointReward: (rewardId: string) => void;
  onOpenCoupon: (couponId: string) => void;
  onViewAllAttention: () => void;
  dismissedAttentionIds: string[];
  onDismissAttention: (itemId: string) => void;
  cashBalance: number;
  autoReloadThreshold: number;
  autoReloadEnabled: boolean;
  cartCount: number;
  xpBalance: number;
  productDisplayMode: ProductDisplayMode;
  partnerOfferDisplayMode: ProductDisplayMode;
};

const bestSellerSkuIds = ["sku-14", "sku-16", "sku-1", "sku-3"];

export function HomeScreen({
  userName,
  onOpenSku,
  onOpenCart,
  onOpenAccount,
  onOpenCoupons,
  onOpenPartnerOffers,
  onOpenTopUp,
  onOpenGift,
  onOpenMissions,
  onOpenMap,
  claimedCouponIds,
  usedBenefitIds,
  onClaimCoupon,
  onViewAllProducts,
  pendingOrders,
  purchasedPartnerOffers,
  redeemedPointRewards,
  onOpenOrder,
  onOpenPartnerVoucher,
  onOpenVoucher,
  onOpenPointReward,
  onOpenCoupon,
  onViewAllAttention,
  dismissedAttentionIds,
  onDismissAttention,
  cashBalance,
  autoReloadThreshold,
  autoReloadEnabled,
  cartCount,
  xpBalance,
  productDisplayMode,
  partnerOfferDisplayMode
}: HomeScreenProps) {
  const [activeAttentionItemId, setActiveAttentionItemId] = useState<string | null>(null);
  const bestSellers = bestSellerSkuIds
    .map((skuId) => skus.find((sku) => sku.id === skuId))
    .filter((sku): sku is (typeof skus)[number] => Boolean(sku));
  const visiblePartnerOffers = partnerOffers.filter(
    (offer) => offer.status === "Active" && (!offer.assetCouponId || !claimedCouponIds.includes(offer.assetCouponId))
  );
  const activeVoucherCount = vouchers.filter((voucher) => voucher.status === "Active").length;
  const attentionItems = createImmediateActions({
    pendingOrders,
    purchasedPartnerOffers,
    redeemedPointRewards,
    claimedCouponIds,
    usedBenefitIds,
    onOpenOrder,
    onOpenPartnerVoucher,
    onOpenVoucher,
    onOpenPointReward,
    onOpenCoupon,
    onOpenTopUp,
    cashBalance,
    autoReloadThreshold,
    autoReloadEnabled
  }).filter((item) => !dismissedAttentionIds.includes(item.id));
  const activeAttentionItem = attentionItems.find((item) => item.id === activeAttentionItemId);

  return (
    <>
      <Screen
        title={`Hello, ${getDisplayFirstName(userName)}`}
        eyebrow={productCopy.brandName}
        scrollKey="home"
        trailing={(
          <View style={styles.headerActions}>
            {cartCount > 0 ? (
              <TouchableOpacity
                style={styles.cartButton}
                onPress={onOpenCart}
                activeOpacity={0.84}
                accessibilityRole="button"
                accessibilityLabel={`Open cart, ${cartCount} items`}
              >
                <Ionicons name="cart-outline" size={22} color={colors.blue} />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={onOpenAccount}
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel="Open account"
            >
              <Ionicons name="person-outline" size={22} color={colors.blue} />
            </TouchableOpacity>
          </View>
        )}
      >
        <CampaignCarousel
          onOpenSku={onOpenSku}
          onOpenCoupons={onOpenCoupons}
          onOpenTopUp={onOpenTopUp}
          onOpenGift={onOpenGift}
        />

      <View style={styles.quickActions}>
        <QuickAction
          icon="wallet-outline"
          label={productCopy.topUp}
          value="15% Bonus"
          valueTone="rewards"
          onPress={onOpenTopUp}
        />
        <QuickAction
          icon="flag-outline"
          label="Missions"
          value="Daily EXP"
          valueTone="points"
          onPress={onOpenMissions}
        />
        <QuickAction
          icon="gift-outline"
          label="My Rewards"
          value={`${activeVoucherCount} Vouchers`}
          valueTone="rewards"
          onPress={onOpenCoupons}
        />
        <QuickAction
          icon="map-outline"
          label="Nearby"
          value="3 POIs"
          valueTone="nearby"
          onPress={onOpenMap}
        />
      </View>

      {attentionItems.length > 0 ? (
        <NeedsAttentionPanel
          items={attentionItems}
          onViewAll={onViewAllAttention}
          onOpenAction={setActiveAttentionItemId}
        />
      ) : null}

      <SectionHeader
        title="Best Sellers"
        action="View All"
        onActionPress={onViewAllProducts}
        style={styles.homeSectionHeader}
      />
      <View style={productDisplayMode === "card" ? styles.productCardGrid : styles.listStack}>
        {bestSellers.map((sku) => (
          <ProductListItem
            key={sku.id}
            contained
            sku={sku}
            xpBalance={xpBalance}
            display={productDisplayMode}
            density="compact"
            style={productDisplayMode === "card" ? styles.productCardGridItem : undefined}
            onPress={() => onOpenSku(sku.id)}
          />
        ))}
      </View>

      <SectionHeader
        title="Partner Offers"
        action="View All"
        onActionPress={onOpenPartnerOffers}
        style={styles.homeSectionHeader}
      />
      <View style={partnerOfferDisplayMode === "card" ? styles.productCardGrid : styles.listStack}>
        {visiblePartnerOffers.slice(0, 2).map((offer) => (
          <OpportunityListItem
            key={offer.id}
            leading={{
              type: "logo",
              label: offer.logoLabel,
              backgroundColor: offer.logoColor,
              color: offer.logoTextColor,
              image: partnerOfferLogos[offer.partnerId]
            }}
            title={offer.partnerName}
            offer={offer.title}
            meta={partnerOfferDisplayMode === "card"
              ? `${offer.distance} away · Ends ${offer.expires}`
              : `${offer.distance} · ${offer.claimedCount.toLocaleString("en-US")} claimed · ${offer.expires}`}
            valueLabel={getPartnerOfferValueLabel(offer)}
            valueMeta={partnerOfferDisplayMode === "card" ? `${offer.claimedCount.toLocaleString("en-US")} ♥` : undefined}
            valueColor={colors.home.partnerValue}
            display={partnerOfferDisplayMode}
            density="compact"
            style={partnerOfferDisplayMode === "card" ? styles.productCardGridItem : undefined}
            onPress={() => onOpenPartnerOffers(offer.id)}
          />
        ))}
      </View>
      </Screen>
      <AttentionActionSheet
        item={activeAttentionItem}
        onClose={() => setActiveAttentionItemId(null)}
        onDismiss={(itemId) => {
          onDismissAttention(itemId);
          setActiveAttentionItemId(null);
        }}
      />
    </>
  );
}

function CampaignCarousel({
  onOpenSku,
  onOpenCoupons,
  onOpenTopUp,
  onOpenGift
}: {
  onOpenSku: (skuId: string) => void;
  onOpenCoupons: () => void;
  onOpenTopUp: () => void;
  onOpenGift: () => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof campaigns)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselWidth = windowWidth - 36;
  const cardWidth = carouselWidth - 20;
  const snapInterval = cardWidth + 10;

  useEffect(() => {
    if (campaigns.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      const nextIndex = (activeIndex + 1) % campaigns.length;
      listRef.current?.scrollToOffset({
        offset: nextIndex * snapInterval,
        animated: true
      });
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeIndex, snapInterval]);

  function handleCampaignPress(target: (typeof campaigns)[number]["target"]) {
    if (target === "coffee") {
      onOpenSku("sku-1");
      return;
    }
    if (target === "coupons") {
      onOpenCoupons();
      return;
    }
    if (target === "gift") {
      onOpenGift();
      return;
    }
    onOpenTopUp();
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    setActiveIndex(Math.max(0, Math.min(nextIndex, campaigns.length - 1)));
  }

  return (
    <View style={styles.carousel}>
      <FlatList
        ref={listRef}
        horizontal
        data={campaigns}
        keyExtractor={(campaign) => campaign.id}
        renderItem={({ item, index }) => {
          const theme = colors.home.campaignCards[index % colors.home.campaignCards.length];
          return (
            <TouchableOpacity
              style={[
                styles.hero,
                {
                  width: cardWidth,
                  marginRight: 10,
                  backgroundColor: theme.background
                }
              ]}
              onPress={() => handleCampaignPress(item.target)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.action}`}
            >
              <View style={styles.heroCopy}>
                <Text style={[styles.heroEyebrow, { color: theme.accent }]}>
                  {item.eyebrow}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.heroText} numberOfLines={2}>
                  {item.subtitle}
                </Text>
                <View style={styles.heroActionRow}>
                  <Text style={[styles.heroAction, { color: theme.accent }]}>
                    {item.action}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.accent} />
                </View>
              </View>
              <View
                style={[
                  styles.heroIcon,
                  { backgroundColor: theme.iconBackground }
                ]}
              >
                <Ionicons name={item.icon} size={34} color={theme.accent} />
              </View>
            </TouchableOpacity>
          );
        }}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.carouselContent}
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index
        })}
      />
      <View style={styles.carouselDots} accessibilityLabel={`Banner ${activeIndex + 1} of ${campaigns.length}`}>
        {campaigns.map((campaign, index) => (
          <View
            key={campaign.id}
            style={[
              styles.carouselDot,
              index === activeIndex && styles.carouselDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function getDisplayFirstName(name: string) {
  const firstName = name.trim().split(/\s+/)[0] || "there";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

export function createImmediateActions({
  pendingOrders,
  purchasedPartnerOffers,
  redeemedPointRewards,
  claimedCouponIds,
  usedBenefitIds,
  onOpenOrder,
  onOpenPartnerVoucher,
  onOpenVoucher,
  onOpenPointReward,
  onOpenCoupon,
  onOpenTopUp,
  cashBalance,
  autoReloadThreshold,
  autoReloadEnabled
}: {
  pendingOrders: OrderRecord[];
  purchasedPartnerOffers: PartnerOfferPurchaseRecord[];
  redeemedPointRewards: RedeemedPointReward[];
  claimedCouponIds: string[];
  usedBenefitIds: string[];
  onOpenOrder: (orderId: string) => void;
  onOpenPartnerVoucher: (voucherCode: string) => void;
  onOpenVoucher: (voucherId: string) => void;
  onOpenPointReward: (rewardId: string) => void;
  onOpenCoupon: (couponId: string) => void;
  onOpenTopUp: () => void;
  cashBalance: number;
  autoReloadThreshold: number;
  autoReloadEnabled: boolean;
}) {
  const orderActions = pendingOrders.map((order): ImmediateActionItem => ({
    id: order.id,
    kind: "prepaid",
    icon: "cafe-outline",
    title: order.title,
    primary: `${order.itemCount} item${order.itemCount > 1 ? "s" : ""} prepaid · ${order.orderNumber}`,
    expiresAt: order.pickupExpiresAtEpoch,
    valueLabel: order.amount,
    referenceLabel: order.orderNumber,
    bottomLabel: order.amount,
    onPress: () => onOpenOrder(order.id)
  }));
  const expiringVoucherActions = vouchers
    .filter((voucher) => voucher.status === "Active" && !usedBenefitIds.includes(createBenefitUsageKey("Voucher", voucher.id)) && isExpiringSoon(voucher.expiresAt))
    .map((voucher): ImmediateActionItem => ({
      id: `voucher-${voucher.id}`,
      kind: "voucher",
      icon: "gift-outline",
      title: voucher.title,
      primary: `${voucher.scope} · Expires ${voucher.expires}`,
      expiresAt: voucher.expiresAt,
      valueLabel: `Up to $${voucher.value.toFixed(2)}`,
      referenceLabel: voucher.code,
      bottomLabel: undefined,
      onPress: () => onOpenVoucher(voucher.id)
    }));
  const redeemedRewardActions = redeemedPointRewards
    .filter((reward) => reward.status === "Active" && isExpiringSoon(reward.expiresAt))
    .map((reward): ImmediateActionItem => ({
      id: `point-reward-${reward.id}`,
      kind: reward.rewardType === "Coupon" ? "coupon" : "voucher",
      icon: reward.rewardType === "Coupon" ? "ticket-outline" : "gift-outline",
      title: reward.title,
      primary: `${reward.rewardType} · Expires ${reward.expiresAt}`,
      expiresAt: reward.expiresAt,
      valueLabel: `${reward.pointsCost.toLocaleString()} Points`,
      referenceLabel: reward.code,
      bottomLabel: undefined,
      onPress: () => onOpenPointReward(reward.id)
    }));
  const claimedCouponActions = coupons
    .filter((coupon) =>
      claimedCouponIds.includes(coupon.id) &&
      coupon.status !== "Used" &&
      coupon.status !== "Expired" &&
      !usedBenefitIds.includes(createBenefitUsageKey("Coupon", coupon.id))
    )
    .map((coupon): ImmediateActionItem | null => {
      const expiresAt = parseCouponAttentionExpiresAt(coupon.expires);
      if (!expiresAt || !isExpiringSoon(expiresAt)) {
        return null;
      }
      return {
        id: `coupon-${coupon.id}`,
        kind: "coupon",
        icon: "ticket-outline",
        title: coupon.merchant,
        primary: `${coupon.offer} · Expires ${coupon.expires}`,
        expiresAt,
        valueLabel: coupon.offer,
        referenceLabel: coupon.code,
        bottomLabel: undefined,
        onPress: () => onOpenCoupon(coupon.id)
      };
    })
    .filter((item): item is ImmediateActionItem => Boolean(item));
  const purchasedPartnerOfferActions = purchasedPartnerOffers
    .map((purchase): ImmediateActionItem | null => {
      const offer = partnerOffers.find((item) => item.id === purchase.offerId && item.offerType === "purchase_offer");
      if (!offer || !isExpiringSoon(offer.validUntil)) {
        return null;
      }
      return {
        id: `partner-offer-${purchase.code}`,
        kind: "partnerOffer",
        icon: offer.purchaseCategory === "ticket" ? "ticket-outline" : "restaurant-outline",
        title: offer.title,
        primary: `${offer.partnerName} · ${offer.price ?? "Purchased"}`,
        expiresAt: offer.validUntil,
        valueLabel: offer.price ?? offer.retailValue ?? "Purchased",
        referenceLabel: purchase.code,
        bottomLabel: undefined,
        onPress: () => onOpenPartnerVoucher(purchase.code)
      };
    })
    .filter((item): item is ImmediateActionItem => Boolean(item));
  const lowBalanceAction: ImmediateActionItem[] =
    cashBalance <= autoReloadThreshold
      ? [{
          id: "low-cash-balance",
          kind: "wallet",
          icon: autoReloadEnabled ? "refresh-outline" : "wallet-outline",
          title: autoReloadEnabled ? "Auto Reload watch" : "Low Cash Balance",
          primary: `Cash $${cashBalance.toFixed(2)} · Below $${autoReloadThreshold}`,
          bottomLabel: "Add",
          onPress: onOpenTopUp
        }]
      : [];
  return sortImmediateActions([...orderActions, ...purchasedPartnerOfferActions, ...redeemedRewardActions, ...claimedCouponActions, ...expiringVoucherActions, ...lowBalanceAction]);
}

function createBenefitUsageKey(type: "Voucher" | "Coupon", id: string) {
  return `${type}:${id}`;
}

function sortImmediateActions(items: ImmediateActionItem[]) {
  const now = Date.now();
  return [...items].sort((a, b) => {
    const aKey = getImmediateActionSortKey(a, now);
    const bKey = getImmediateActionSortKey(b, now);
    if (aKey.score !== bKey.score) {
      return bKey.score - aKey.score;
    }
    if (aKey.expiresAt !== bKey.expiresAt) {
      return aKey.expiresAt - bKey.expiresAt;
    }
    if (aKey.lossRank !== bKey.lossRank) {
      return bKey.lossRank - aKey.lossRank;
    }
    return a.title.localeCompare(b.title);
  });
}

function getImmediateActionSortKey(item: ImmediateActionItem, now: number) {
  const remainingSeconds = getAttentionRemainingSeconds(item.expiresAt, now);
  const expiresAt = getAttentionExpiryTime(item.expiresAt) ?? Number.MAX_SAFE_INTEGER;
  const lossRank = getImmediateActionLossRank(item.kind);
  return {
    score: getImmediateActionTimeScore(remainingSeconds) + lossRank + getImmediateActionEnablementScore(item.kind),
    expiresAt,
    lossRank
  };
}

function getImmediateActionTimeScore(remainingSeconds: number) {
  if (remainingSeconds <= 0) {
    return 0;
  }
  if (remainingSeconds <= 2 * 60 * 60) {
    return 10000;
  }
  if (remainingSeconds <= 24 * 60 * 60) {
    return 8000;
  }
  if (remainingSeconds <= 3 * 24 * 60 * 60) {
    return 5000;
  }
  if (remainingSeconds <= 7 * 24 * 60 * 60) {
    return 2500;
  }
  if (remainingSeconds <= 30 * 24 * 60 * 60) {
    return 1000;
  }
  return 0;
}

function getImmediateActionLossRank(kind: ImmediateActionItem["kind"]) {
  switch (kind) {
    case "partnerOffer":
      return 900;
    case "prepaid":
      return 800;
    case "voucher":
    case "coupon":
      return 500;
    case "wallet":
      return 120;
    default:
      return 0;
  }
}

function getImmediateActionEnablementScore(kind: ImmediateActionItem["kind"]) {
  return kind === "wallet" ? 350 : 0;
}

function isExpiringSoon(expiresAt: string) {
  const expiresTime = new Date(`${expiresAt}T23:59:59`).getTime();
  if (Number.isNaN(expiresTime)) {
    return false;
  }
  const daysRemaining = (expiresTime - Date.now()) / (24 * 60 * 60 * 1000);
  return daysRemaining >= 0 && daysRemaining <= 30;
}

function parseCouponAttentionExpiresAt(expires: string) {
  const parsed = new Date(`${expires} ${new Date().getFullYear()}`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function NeedsAttentionPanel({
  items,
  onViewAll,
  onOpenAction
}: {
  items: ImmediateActionItem[];
  onViewAll: () => void;
  onOpenAction: (itemId: string) => void;
}) {
  const multipleItems = items.length > 1;
  const visibleItems = items.slice(0, 3);
  const subtitle = items.length > visibleItems.length
    ? `Top ${visibleItems.length} of ${items.length} actions`
    : `${items.length} action${multipleItems ? "s" : ""} ready now`;
  return (
    <View style={styles.attentionPanel}>
      <SectionHeader
        title="Needs Attention"
        action={multipleItems ? "View All" : "Manage"}
        onActionPress={onViewAll}
        style={styles.attentionSectionHeader}
      />
      <TouchableOpacity
        style={[
          styles.attentionNotice,
          {
            backgroundColor: colors.home.prepaidSubtleBackground,
            borderColor: colors.home.prepaidBorder
          }
        ]}
        onPress={onViewAll}
        activeOpacity={0.84}
        accessibilityRole="button"
        accessibilityLabel="View All Needs Attention"
      >
        <View style={styles.attentionNoticeIcon}>
          <Ionicons name="flash-outline" size={16} color={colors.blue} />
        </View>
        <View style={styles.attentionNoticeCopy}>
          <Text style={styles.attentionNoticeTitle} numberOfLines={1}>{subtitle}</Text>
          <Text style={styles.attentionNoticeText} numberOfLines={1}>Orders, vouchers, and wallet alerts.</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={colors.blue} />
      </TouchableOpacity>

      <AppCard style={styles.attentionList}>
        {visibleItems.map((item, index) => {
          return (
            <RecordListItem
              key={item.id}
              leading={getAttentionRankLeading(item, index)}
              title={item.title}
              primary={item.primary}
              lines={2}
              density="compact"
              trailing={{
                type: "custom",
                node: <HomeAttentionTrailing item={item} />
              }}
              last={index === visibleItems.length - 1}
              onPress={() => onOpenAction(item.id)}
            />
          );
        })}
      </AppCard>
    </View>
  );
}

export function NeedsAttentionScreen({
  items,
  dismissedAttentionIds,
  onDismiss,
  onBack
}: {
  items: ImmediateActionItem[];
  dismissedAttentionIds: string[];
  onDismiss: (itemId: string) => void;
  onBack: () => void;
}) {
  const visibleItems = items.filter((item) => !dismissedAttentionIds.includes(item.id));
  const [activeAttentionItemId, setActiveAttentionItemId] = useState<string | null>(null);
  const activeAttentionItem = visibleItems.find((item) => item.id === activeAttentionItemId);

  return (
    <>
      <Screen
        title="Needs Attention"
        eyebrow="Action center"
        scrollKey="needs-attention"
        onBack={onBack}
        backLabel="Back to Home"
      >
        <Text style={styles.attentionIntro}>
          Open an item to act, view details, or manage this reminder.
        </Text>
        <AppCard style={styles.attentionListCard}>
          {visibleItems.length ? (
            visibleItems.map((item, index) => (
              <RecordListItem
                key={item.id}
                leading={getAttentionRankLeading(item, index)}
                title={item.title}
                primary={item.primary}
                lines={2}
                density="compact"
                trailing={{
                  type: "custom",
                  node: <HomeAttentionTrailing item={item} />
                }}
                last={index === visibleItems.length - 1}
                onPress={() => setActiveAttentionItemId(item.id)}
              />
            ))
          ) : (
            <View style={styles.attentionEmpty}>
              <Text style={styles.attentionEmptyTitle}>All caught up</Text>
              <Text style={styles.attentionEmptyText}>Nothing needs immediate action right now.</Text>
            </View>
          )}
        </AppCard>
      </Screen>
      <AttentionActionSheet
        item={activeAttentionItem}
        onClose={() => setActiveAttentionItemId(null)}
        onDismiss={(itemId) => {
          onDismiss(itemId);
          setActiveAttentionItemId(null);
        }}
      />
    </>
  );
}

function getAttentionRankLeading(item: ImmediateActionItem, index: number) {
  const rankColors = [
    { backgroundColor: "#FFE6DE", color: "#D84A1B" },
    { backgroundColor: "#FFF0D8", color: "#C97A16" },
    { backgroundColor: "#FFF7D9", color: "#A98200" }
  ];
  const rank = rankColors[index];
  if (!rank) {
    return {
      type: "icon" as const,
      icon: item.icon,
      tone: "info" as const,
      color: colors.blue
    };
  }
  return {
    type: "icon" as const,
    icon: item.icon,
    backgroundColor: rank.backgroundColor,
    color: rank.color
  };
}

function AttentionActionSheet({
  item,
  onClose,
  onDismiss
}: {
  item?: ImmediateActionItem;
  onClose: () => void;
  onDismiss: (itemId: string) => void;
}) {
  const [now, setNow] = useState(Date.now());
  const copy = item ? getAttentionActionCopy(item) : null;
  const hasCountdown = Boolean(item?.expiresAt);

  useEffect(() => {
    if (!hasCountdown) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasCountdown]);

  if (!item || !copy) {
    return null;
  }

  const countdown = hasCountdown ? formatAttentionCountdown(item.expiresAt, now, true) : item.bottomLabel ?? "Ready";
  const remainingSeconds = getAttentionRemainingSeconds(item.expiresAt, now);
  const fields = getAttentionActionFields(item);
  const visibleFields = fields.filter((field) => !field.muted);
  const referenceText = getAttentionReferenceText(item);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={Boolean(item)}
      onRequestClose={onClose}
    >
      <Pressable style={styles.attentionSheetOverlay} onPress={onClose}>
        <Pressable style={styles.attentionSheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.attentionSheetHandle} />
          <View style={styles.attentionSheetHeader}>
            <View style={styles.attentionSheetHeaderCopy}>
              <Text style={styles.attentionSheetTitle}>Needs Attention</Text>
              <Text style={styles.attentionSheetSubtitle}>Review and act on this reminder</Text>
            </View>
            <View style={styles.attentionSheetActions}>
              <View style={styles.attentionTypeBadge}>
                <Text style={styles.attentionTypeBadgeText}>{copy.statusLabel}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel="Close attention action"
                style={styles.attentionSheetClose}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.attentionActionHero}>
            <View style={[styles.attentionActionIcon, { backgroundColor: copy.iconBackground }]}>
              <Ionicons name={item.icon} size={24} color={copy.iconColor} />
            </View>
            <View style={styles.attentionActionCopy}>
              <Text style={styles.attentionActionTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.attentionActionText}>{copy.description}</Text>
            </View>
          </View>

          {referenceText ? (
            <Text style={styles.attentionReferenceText} numberOfLines={1}>
              {referenceText}
            </Text>
          ) : null}

          <View style={styles.attentionActionStatusCard}>
            <View style={styles.attentionInfoRow}>
              <View style={styles.attentionFieldGrid}>
                {visibleFields.map((field) => (
                  <View key={field.label} style={styles.attentionField}>
                    <Text style={styles.attentionFieldLabel}>{field.label}</Text>
                    <Text
                      style={styles.attentionFieldValue}
                      numberOfLines={1}
                    >
                      {field.value}
                    </Text>
                  </View>
                ))}
              </View>
              {hasCountdown ? (
                <View style={styles.attentionActionStatusRight}>
                  <Text
                    style={[
                      styles.attentionActionCountdown,
                      { color: getAttentionCountdownColor(remainingSeconds) }
                    ]}
                    numberOfLines={1}
                  >
                    {countdown}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.attentionActionButtons}>
            <TouchableOpacity
              activeOpacity={0.84}
              style={styles.attentionPrimaryButton}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Text style={styles.attentionPrimaryButtonText}>{copy.primaryAction}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.78}
              style={styles.attentionSecondaryButton}
              onPress={() => onDismiss(item.id)}
            >
              <Ionicons name="eye-off-outline" size={17} color={colors.muted} />
              <Text style={styles.attentionSecondaryButtonText}>Hide Reminder</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.attentionActionFootnote}>
            Hidden reminders do not remove the order, voucher, or wallet item.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getAttentionActionCopy(item: ImmediateActionItem) {
  switch (item.kind) {
    case "prepaid":
      return {
        screenTitle: "Pickup Action",
        description: "This prepaid order is ready. Collect it before the pickup window expires.",
        statusLabel: "Order",
        primaryAction: "Pickup Code",
        iconBackground: colors.home.prepaidSubtleBackground,
        iconColor: colors.blue
      };
    case "partnerOffer":
      return {
        screenTitle: "Partner Offer Action",
        description: "You bought this partner offer in the app. Use it before it expires to avoid losing value.",
        statusLabel: "Partner",
        primaryAction: "Show Voucher",
        iconBackground: colors.home.prepaidSubtleBackground,
        iconColor: colors.blue
      };
    case "voucher":
      return {
        screenTitle: "Voucher Action",
        description: "This voucher is active and approaching its expiry window.",
        statusLabel: "Voucher",
        primaryAction: "Use Voucher",
        iconBackground: colors.home.prepaidSubtleBackground,
        iconColor: colors.blue
      };
    case "coupon":
      return {
        screenTitle: "Coupon Action",
        description: "This coupon is active and approaching its expiry window.",
        statusLabel: "Coupon",
        primaryAction: "Use Coupon",
        iconBackground: colors.home.prepaidSubtleBackground,
        iconColor: colors.blue
      };
    case "wallet":
    default:
      return {
        screenTitle: "Wallet Action",
        description: "Your Cash Balance is below the alert threshold. Add funds to keep wallet payments ready.",
        statusLabel: "Wallet",
        primaryAction: "Add Funds",
        iconBackground: colors.home.prepaidSubtleBackground,
        iconColor: colors.blue
      };
  }
}

function getAttentionActionFields(item: ImmediateActionItem) {
  if (item.kind === "prepaid") {
    const itemMatch = item.primary.match(/^(.+?) prepaid · (.+)$/);
    return [
      { label: "Items", value: itemMatch?.[1] ?? "Prepaid" },
      { label: "Paid", value: item.valueLabel ?? item.bottomLabel ?? "-" },
      { label: "Order No.", value: item.referenceLabel ?? itemMatch?.[2] ?? item.primary, muted: true }
    ];
  }
  if (item.kind === "partnerOffer") {
    const partnerMatch = item.primary.match(/^(.+?) · (.+)$/);
    return [
      { label: "Partner", value: partnerMatch?.[1] ?? item.primary },
      { label: "Paid", value: item.valueLabel ?? partnerMatch?.[2] ?? "-" },
      { label: "Voucher No.", value: item.referenceLabel ?? "-", muted: true }
    ];
  }
  if (item.kind === "coupon") {
    const couponMatch = item.primary.match(/^(.+?) · Expires (.+)$/);
    return [
      { label: "Offer", value: couponMatch?.[1] ?? item.primary },
      { label: "Expires", value: couponMatch?.[2] ?? "Soon" },
      { label: "Coupon No.", value: item.referenceLabel ?? "-", muted: true }
    ];
  }
  if (item.kind === "voucher") {
    const rewardMatch = item.primary.match(/^(.+?) · Expires (.+)$/);
    return [
      { label: "Scope", value: rewardMatch?.[1] ?? item.primary },
      { label: "Value", value: item.valueLabel ?? "Active" },
      { label: "Voucher No.", value: item.referenceLabel ?? "-", muted: true }
    ];
  }
  const walletMatch = item.primary.match(/^Cash (.+?) · Below (.+)$/);
  return [
    { label: "Cash", value: walletMatch?.[1] ?? item.primary },
    { label: "Threshold", value: walletMatch?.[2] ?? "-" },
    { label: "Status", value: "Low" }
  ];
}

function getAttentionReferenceText(item: ImmediateActionItem) {
  if (!item.referenceLabel) {
    return "";
  }
  switch (item.kind) {
    case "prepaid":
      return `Order ID ${item.referenceLabel}`;
    case "partnerOffer":
      return `Voucher ID ${item.referenceLabel}`;
    case "voucher":
      return `Voucher ID ${item.referenceLabel}`;
    case "coupon":
      return `Coupon ID ${item.referenceLabel}`;
    case "wallet":
    default:
      return "";
  }
}

function HomeAttentionTrailing({ item }: { item: ImmediateActionItem }) {
  const hasCountdown = Boolean(item.expiresAt);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!hasCountdown) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasCountdown]);

  if (!hasCountdown) {
    return (
      <View style={styles.homeAttentionTrailingSingle}>
        <Text style={styles.homeAttentionTrailingAction} numberOfLines={1}>
          {item.bottomLabel ?? "View"}
        </Text>
      </View>
    );
  }

  const remainingSeconds = getAttentionRemainingSeconds(item.expiresAt, now);
  return (
    <View style={styles.homeAttentionTrailing}>
      <Text
        style={[
          styles.homeAttentionTrailingTop,
          { color: getAttentionCountdownColor(remainingSeconds) }
        ]}
        numberOfLines={1}
      >
        {formatAttentionCountdown(item.expiresAt, now)}
      </Text>
      {item.bottomLabel ? (
        <Text style={styles.homeAttentionTrailingBottom} numberOfLines={1}>
          {item.bottomLabel}
        </Text>
      ) : null}
    </View>
  );
}

function formatAttentionCountdown(expiresAt: number | string | undefined, now: number, showSeconds = false) {
  const expiryTime = getAttentionExpiryTime(expiresAt);
  if (!expiryTime || Number.isNaN(expiryTime)) {
    return "Expired";
  }
  const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
  if (remainingSeconds <= 0) {
    return "Expired";
  }
  if (remainingSeconds > 24 * 60 * 60) {
    return `${Math.ceil(remainingSeconds / (24 * 60 * 60))}d left`;
  }
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  if (hours > 0) {
    if (showSeconds) {
      return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getAttentionRemainingSeconds(expiresAt: number | string | undefined, now: number) {
  const expiryTime = getAttentionExpiryTime(expiresAt);
  if (!expiryTime || Number.isNaN(expiryTime)) {
    return 0;
  }
  return Math.max(0, Math.floor((expiryTime - now) / 1000));
}

function getAttentionExpiryTime(expiresAt: number | string | undefined) {
  if (typeof expiresAt === "number") {
    return expiresAt;
  }
  if (!expiresAt) {
    return undefined;
  }
  const parsed = new Date(expiresAt.includes("T") ? expiresAt : `${expiresAt}T23:59:59`).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getAttentionCountdownColor(remainingSeconds: number) {
  if (remainingSeconds <= 0) {
    return colors.muted;
  }
  if (remainingSeconds > 24 * 60 * 60) {
    return colors.success;
  }
  if (remainingSeconds < 5 * 60 * 60) {
    return colors.berry;
  }
  return colors.warning;
}

function QuickAction({
  icon,
  label,
  value,
  valueTone,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueTone?: "points" | "nearby" | "rewards" | "warning";
  onPress?: () => void;
}) {
  const tone = valueTone === "points" ? "info" : valueTone === "rewards" ? "success" : valueTone === "warning" ? "danger" : "neutral";
  return (
    <ActionTile
      icon={icon}
      label={label}
      badge={value}
      tone={tone}
      style={{ backgroundColor: colors.home.quickActionBackground, borderColor: colors.line }}
      onPress={onPress}
    />
  );
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  attentionPanel: {
    marginTop: 12
  },
  attentionSectionHeader: {
    marginTop: 0,
    marginBottom: 6
  },
  attentionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8
  },
  attentionNoticeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  attentionNoticeCopy: {
    flex: 1,
    minWidth: 0
  },
  attentionNoticeTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  attentionNoticeText: {
    color: colors.blue,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginTop: 2
  },
  attentionList: {
    paddingVertical: 3,
    overflow: "hidden"
  },
  attentionIntro: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginBottom: 12
  },
  attentionListCard: {
    paddingVertical: 4
  },
  attentionSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 29, 34, 0.34)"
  },
  attentionSheet: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 12
  },
  attentionSheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 13
  },
  attentionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  attentionSheetHeaderCopy: {
    flex: 1,
    minWidth: 0
  },
  attentionSheetActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0
  },
  attentionSheetTitle: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700"
  },
  attentionSheetSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    marginTop: 3
  },
  attentionSheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  attentionActionHero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    marginBottom: 12
  },
  attentionActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  attentionActionCopy: {
    flex: 1,
    minWidth: 0
  },
  attentionTypeBadge: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: colors.home.prepaidSubtleBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.home.prepaidBorder
  },
  attentionTypeBadgeText: {
    color: colors.blue,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700"
  },
  attentionActionTitle: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700"
  },
  attentionActionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
    marginTop: 7
  },
  attentionActionStatusCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    marginBottom: 14
  },
  attentionReferenceText: {
    alignSelf: "flex-end",
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    marginTop: -2,
    marginBottom: 7,
    paddingHorizontal: 12,
    textAlign: "right"
  },
  attentionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  attentionActionStatusRight: {
    minWidth: 86,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: 2
  },
  attentionActionCountdown: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    textAlign: "right"
  },
  attentionFieldGrid: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  attentionField: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2
  },
  attentionFieldLabel: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500"
  },
  attentionFieldValue: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 3
  },
  attentionActionButtons: {
    flexDirection: "row",
    gap: 10
  },
  attentionPrimaryButton: {
    flex: 1.25,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  attentionPrimaryButtonText: {
    color: colors.onDark,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700"
  },
  attentionSecondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  attentionSecondaryButtonText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600"
  },
  attentionActionFootnote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    marginTop: 12,
    paddingHorizontal: 4
  },
  homeAttentionTrailing: {
    width: 58,
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 1
  },
  homeAttentionTrailingSingle: {
    width: 58,
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center"
  },
  homeAttentionTrailingTop: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    textAlign: "right"
  },
  homeAttentionTrailingBottom: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "right"
  },
  homeAttentionTrailingAction: {
    color: colors.blue,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "right"
  },
  attentionEmpty: {
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20
  },
  attentionEmptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  attentionEmptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    marginTop: 5,
    textAlign: "center"
  },
  listStack: {
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
  assetCard: {
    overflow: "hidden"
  },
  assetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  assetLabel: {
    color: "#D7CEBD",
    fontSize: 13,
    fontWeight: "700"
  },
  assetValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4
  },
  assetPrimaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3
  },
  assetBalanceBreakdown: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3
  },
  assetHint: {
    color: "#F3D18E",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 120,
    textAlign: "right"
  },
  assetGrid: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10
  },
  expiringCouponArea: {
    marginTop: 14,
    gap: 7
  },
  expiringCouponHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  expiringCouponTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700"
  },
  expiringCouponRow: {
    minHeight: 45,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 8
  },
  expiringCouponCopy: {
    flex: 1
  },
  expiringCouponMerchant: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  },
  expiringCouponOffer: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  expiringCouponDate: {
    fontSize: 11,
    fontWeight: "700"
  },
  assetItem: {
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12
  },
  assetItemCompact: {
    flexGrow: 0.72
  },
  assetItemWide: {
    flexGrow: 1.56
  },
  assetItemTap: {
    minHeight: 62
  },
  assetItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4
  },
  assetItemValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700"
  },
  assetItemLabel: {
    color: "#D7CEBD",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  assetItemDetail: {
    color: "#BFB6A6",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 3
  },
  quickActions: {
    marginTop: 4,
    marginBottom: 0,
    flexDirection: "row",
    gap: 7
  },
  homeSectionHeader: {
    marginTop: 18,
    marginBottom: 10
  },
  carousel: {
    marginBottom: 2,
    overflow: "visible"
  },
  carouselContent: {
    paddingRight: 10
  },
  carouselDots: {
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CEC5B5"
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: colors.coffee
  },
  hero: {
    height: 156,
    padding: 16,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden"
  },
  heroCopy: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    paddingRight: 10
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 6
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  heroText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "400",
    marginTop: 6,
    lineHeight: 18
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10
  },
  heroAction: {
    fontSize: 13,
    fontWeight: "700"
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
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
  profileButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.tint,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  }
});
