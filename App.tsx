import { StatusBar } from "expo-status-bar";
import { Animated, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createImmediateActions, HomeScreen, NeedsAttentionScreen } from "./src/screens/HomeScreen";
import { CategoryScreen } from "./src/screens/CategoryScreen";
import { ScanPayScreen } from "./src/screens/ScanPayScreen";
import { VMMapScreen } from "./src/screens/VMMapScreen";
import { MeScreen, PartnerBenefitsScreen, PointsScreen, Profile } from "./src/screens/MeScreen";
import { VMDetailScreen } from "./src/screens/VMDetailScreen";
import { SkuDetailScreen } from "./src/screens/SkuDetailScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CouponListScreen } from "./src/screens/CouponListScreen";
import type { CouponAssetTarget, RewardFilter } from "./src/screens/CouponListScreen";
import { PartnerOffersScreen } from "./src/screens/PartnerOffersScreen";
import { BenefitListScreen } from "./src/screens/BenefitListScreen";
import { TopUpScreen } from "./src/screens/TopUpScreen";
import { CheckoutCashierRequest, CheckoutScreen } from "./src/screens/PurchaseScreen";
import { CashierPaymentOutcome, CashierScreen } from "./src/screens/CashierScreen";
import { TierScreen } from "./src/screens/TierScreen";
import { ExpHistoryScreen } from "./src/screens/ExpHistoryScreen";
import { PaymentMethodSelectionScreen } from "./src/screens/PaymentMethodSelectionScreen";
import { ActivityScreen, ActivityTab, GiftHistoryScreen } from "./src/screens/ActivityScreen";
import { OrderDetailScreen } from "./src/screens/OrderDetailScreen";
import { GiftCashierRequest, GiftScreen } from "./src/screens/GiftScreen";
import { MissionsScreen } from "./src/screens/MissionsScreen";
import { RewardsScreen } from "./src/screens/RewardsScreen";
import { clearSavedScrollPosition } from "./src/components/Screen";
import { skus } from "./src/data/appData";
import type { PartnerOffer } from "./src/data/appData";
import {
  getAvailablePaymentMethods,
  getEligibleDefaultPaymentMethod,
  getPaymentMethod,
  SavedPaymentCard,
  PaymentMethodId,
  PaymentMethodMode
} from "./src/paymentMethods";
import {
  activateAppTheme,
  AppThemeId,
  colors,
  controlSizes,
  radii,
  spacing,
  statusColors,
  typography
} from "./src/theme";
import {
  CartItem,
  BenefitApplied,
  CheckoutResult,
  FriendRecord,
  GiftPurchaseResult,
  OrderRecord,
  PartnerOfferPurchaseRecord,
  PaymentHistoryRecord,
  RedeemedPointReward,
  TopUpResult,
  UsedBenefitRecord,
  WalletBalances,
  WalletHistoryRecord,
  XpRecord
} from "./src/types";
import { useEffect, useRef, useState } from "react";
import { productCopy } from "./src/productCopy";
import {
  addCartItem,
  applyCheckout,
  applyGiftPurchase,
  applyTopUp,
  applyXpAction,
  claimCoupon,
  createPartnerVoucherCode,
  createInitialAppState,
  expireEligibleOrders,
  purchasePartnerOffer,
  redeemPoints,
  removeCartItem as removeCartItemFromState,
  resolveProductDisplayMode,
  setAutoReloadSettings as setAutoReloadSettingsInState,
  setDefaultPaymentMethod,
  setAppTheme,
  setProductDisplayDefaultMode,
  setProductDisplayPreference,
  toggleFavorite
} from "./src/state/appState";
import type { ProductDisplayArea, ProductDisplayMode, ProductDisplayOverride, ProductDisplayPreferences } from "./src/state/appState";
import { loadPersistedAppState, savePersistedAppState } from "./src/state/persistence";
import { XpAction } from "./src/xp";
import { AppToastMessage, AppToastTone } from "./src/feedback";
import { getTierByExp } from "./src/tiers";
import { getTierVisual } from "./src/tierVisuals";
import { AutoReloadSettings } from "./src/autoReload";
import { BonusSummary, calculateBonusSummary } from "./src/bonusSummary";

type TabKey = "home" | "category" | "scan" | "gift" | "rewards" | "map" | "me";
type ExpToast = {
  amount: number;
  title: string;
  description: string;
  type: XpRecord["type"];
};

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "home", label: productCopy.home, icon: "home-outline", activeIcon: "home" },
  { key: "category", label: productCopy.order, icon: "cafe-outline", activeIcon: "cafe" },
  { key: "scan", label: productCopy.scanAndPay, icon: "scan-outline", activeIcon: "qr-code" },
  { key: "gift", label: "Gift", icon: "gift-outline", activeIcon: "gift" },
  { key: "rewards", label: "Rewards", icon: "sparkles-outline", activeIcon: "sparkles" }
];

const rootTabScrollKeys: Partial<Record<TabKey, string>> = {
  home: "home",
  category: "order",
  scan: "scan-pay",
  gift: "gift-home",
  rewards: "rewards",
  map: "vm-map",
  me: "account-home"
};

const defaultProfile: Profile = {
  name: "ROBERT HUI",
  email: "alex@example.com",
  phone: "+1 604 555 0188"
};

function createDefaultSavedPaymentCards(): SavedPaymentCard[] {
  return [
    {
      id: "visa-4242",
      brand: "Visa",
      last4: "4242",
      cardholder: "ROBERT HUI",
      expiry: "08/29"
    }
  ];
}

function getRecordTimestamp(recordId: string) {
  const match = recordId.match(/\d{10,}/);
  return match ? Number(match[0]) : 0;
}

function oldestFirst<T extends { id: string }>(records: T[]) {
  return [...records].sort((a, b) => getRecordTimestamp(a.id) - getRecordTimestamp(b.id));
}

function getFirstTopUpAmount(paymentHistory: PaymentHistoryRecord[]) {
  const firstTopUp = oldestFirst(
    paymentHistory.filter((item) => item.type === "Top Up" && item.status === "Completed")
  )[0];
  return firstTopUp ? firstTopUp.paidAmount ?? Math.max(firstTopUp.amount, 0) : 0;
}

function getFirstXpAmount(xpHistory: XpRecord[], type: XpRecord["type"]) {
  return oldestFirst(xpHistory.filter((item) => item.type === type))[0]?.amount ?? 0;
}

function getActiveMissionCount({
  checkedInToday,
  addFundsTotal,
  appPurchaseCount,
  sentGiftCount
}: {
  checkedInToday: boolean;
  addFundsTotal: number;
  appPurchaseCount: number;
  sentGiftCount: number;
}) {
  return [
    !checkedInToday,
    addFundsTotal <= 0,
    appPurchaseCount <= 0,
    sentGiftCount <= 0
  ].filter(Boolean).length;
}

function getCashierAvailablePaymentMethods(
  methods: ReturnType<typeof getAvailablePaymentMethods>,
  recentCard: SavedPaymentCard | null
) {
  if (!recentCard) {
    return methods;
  }
  const cardMethod = {
    ...getPaymentMethod("card"),
    subtitle: `${recentCard.brand} · •••• ${recentCard.last4}`
  };
  const hasCard = methods.some((method) => method.id === "card");
  return hasCard
    ? methods.map((method) => method.id === "card" ? cardMethod : method)
    : [...methods.filter((method) => method.id !== "card"), cardMethod];
}

function getCashierSavedCards(cards: SavedPaymentCard[], recentCard: SavedPaymentCard | null) {
  if (!recentCard || cards.some((card) => card.id === recentCard.id)) {
    return cards;
  }
  return [...cards, recentCard];
}

function calculateInstantPointsBenefit(amount: number, pointsBalance: number): InstantPointsBenefit {
  const safeAmount = roundCurrency(Math.max(0, amount));
  const safePoints = Math.max(0, Math.floor(pointsBalance));
  if (safeAmount <= 0 || safePoints <= 0) {
    return {
      payableAmount: safeAmount,
      pointsRedeemed: 0,
      benefitsApplied: []
    };
  }

  const pointsPerDollar = 350;
  const fullPointsCost = Math.ceil(safeAmount * pointsPerDollar);
  if (safePoints >= fullPointsCost) {
    return {
      payableAmount: 0,
      pointsRedeemed: fullPointsCost,
      benefitsApplied: [{
        id: "points-instant-redeem",
        type: "Points",
        title: "Use Points",
        valueApplied: safeAmount,
        pointsCost: fullPointsCost
      }]
    };
  }

  const redeemableCents = Math.min(Math.floor((safePoints / pointsPerDollar) * 100), Math.round(safeAmount * 100));
  const valueApplied = roundCurrency(redeemableCents / 100);
  const pointsRedeemed = valueApplied > 0 ? Math.min(safePoints, Math.ceil(valueApplied * pointsPerDollar)) : 0;

  return {
    payableAmount: roundCurrency(safeAmount - valueApplied),
    pointsRedeemed,
    benefitsApplied: pointsRedeemed > 0 ? [{
      id: "points-instant-redeem",
      type: "Points",
      title: "Use Points",
      valueApplied,
      pointsCost: pointsRedeemed
    }] : []
  };
}

type PendingGiftCashier = {
  request: GiftCashierRequest;
  onSuccess: (giftCode: string) => void;
  onCancel: () => void;
  onFailure: () => void;
};

type PendingCheckoutCashier = {
  request: CheckoutCashierRequest;
};

type OrderDetailReturnTarget = "home" | "attention" | "orders";

type InstantPointsBenefit = {
  payableAmount: number;
  pointsRedeemed: number;
  benefitsApplied: BenefitApplied[];
};

function renderScreen(
  activeTab: TabKey,
  setActiveTab: (tab: TabKey) => void,
  activeVMId: string | null,
  setActiveVMId: (vmId: string | null) => void,
  activeSkuId: string | null,
  setActiveSkuId: (skuId: string | null) => void,
  isCartOpen: boolean,
  setIsCartOpen: (isOpen: boolean) => void,
  isCouponListOpen: boolean,
  setIsCouponListOpen: (isOpen: boolean) => void,
  activeCouponAsset: CouponAssetTarget | null,
  setActiveCouponAsset: (asset: CouponAssetTarget | null) => void,
  couponInitialFilter: RewardFilter,
  setCouponInitialFilter: (filter: RewardFilter) => void,
  isPartnerOffersOpen: boolean,
  setIsPartnerOffersOpen: (isOpen: boolean) => void,
  activePartnerOfferId: string | null,
  setActivePartnerOfferId: (offerId: string | null) => void,
  setCashierPartnerOffer: (offer: PartnerOffer | null) => void,
  setCashierRecentCard: (card: SavedPaymentCard | null) => void,
  setCashierCardId: (cardId: string) => void,
  setCashierTopUp: (result: Omit<TopUpResult, "paymentMethodId"> | null) => void,
  setCashierGift: (gift: PendingGiftCashier | null) => void,
  setCashierCheckout: (checkout: PendingCheckoutCashier | null) => void,
  setCashierPayment: (methodId: PaymentMethodId) => void,
  isBenefitListOpen: boolean,
  setIsBenefitListOpen: (isOpen: boolean) => void,
  isTopUpOpen: boolean,
  setIsTopUpOpen: (isOpen: boolean) => void,
  isTierOpen: boolean,
  setIsTierOpen: (isOpen: boolean) => void,
  isExpHistoryOpen: boolean,
  setIsExpHistoryOpen: (isOpen: boolean) => void,
  isMissionsOpen: boolean,
  setIsMissionsOpen: (isOpen: boolean) => void,
  isPointsOpen: boolean,
  setIsPointsOpen: (isOpen: boolean) => void,
  isPartnerBenefitsOpen: boolean,
  setIsPartnerBenefitsOpen: (isOpen: boolean) => void,
  isAttentionOpen: boolean,
  setIsAttentionOpen: (isOpen: boolean) => void,
  isGiftHistoryOpen: boolean,
  setIsGiftHistoryOpen: (isOpen: boolean) => void,
  dismissedAttentionIds: string[],
  onDismissAttention: (itemId: string) => void,
  activityTab: ActivityTab | null,
  setActivityTab: (tab: ActivityTab | null) => void,
  activityReadyOnly: boolean,
  setActivityReadyOnly: (readyOnly: boolean) => void,
  activeHomeOrderId: string | null,
  setActiveHomeOrderId: (orderId: string | null) => void,
  activeHomeOrderReturnTarget: OrderDetailReturnTarget,
  setActiveHomeOrderReturnTarget: (target: OrderDetailReturnTarget) => void,
  activePaymentMode: PaymentMethodMode | null,
  setActivePaymentMode: (mode: PaymentMethodMode | null) => void,
  setActivePaymentInitialPage: (page: "list" | "add-method") => void,
  activePaymentPayable: number,
  setActivePaymentPayable: (amount: number) => void,
  activePaymentPoints: number,
  setActivePaymentPoints: (points: number) => void,
  userProfile: Profile,
  meInitialPage: "points" | null,
  setMeInitialPage: (page: "points" | null) => void,
  setUserProfile: (profile: Profile) => void,
  checkoutItems: CartItem[] | null,
  setCheckoutItems: (items: CartItem[] | null) => void,
  checkoutBenefitAsset: CouponAssetTarget | null,
  setCheckoutBenefitAsset: (asset: CouponAssetTarget | null) => void,
  checkoutPayment: PaymentMethodId,
  setCheckoutPayment: (methodId: PaymentMethodId) => void,
  topUpPayment: PaymentMethodId,
  setTopUpPayment: (methodId: PaymentMethodId) => void,
  giftPayment: PaymentMethodId,
  setGiftPayment: (methodId: PaymentMethodId) => void,
  cashBalance: number,
  walletBalance: number,
  walletBalances: WalletBalances,
  bonusSummary: BonusSummary,
  autoReloadSettings: AutoReloadSettings,
  onChangeAutoReloadSettings: (settings: AutoReloadSettings) => void,
  pointsBalance: number,
  xpBalance: number,
  xpHistory: XpRecord[],
  checkInStreak: number,
  lastCheckInDate: string | null,
  handleXpAction: (action: XpAction, eventKey: string) => void,
  handleRedeemPoints: (reward: { id: string; title: string; pointsCost: number; validDays?: number; rewardType: "Coupon" | "Voucher" }) => void,
  handleTopUp: (result: TopUpResult) => void,
  sentGifts: import("./src/types").GiftRecord[],
  friends: FriendRecord[],
  handleGiftPurchase: (result: GiftPurchaseResult) => string | null,
  orders: OrderRecord[],
  paymentHistory: PaymentHistoryRecord[],
  walletHistory: WalletHistoryRecord[],
  claimedCouponIds: string[],
  purchasedPartnerOffers: PartnerOfferPurchaseRecord[],
  redeemedPointRewards: RedeemedPointReward[],
  usedBenefitIds: string[],
  usedBenefitRecords: UsedBenefitRecord[],
  handleClaimCoupon: (couponId: string) => void,
  handlePurchasePartnerOffer: (offer: PartnerOffer, options?: { usePointsBenefit?: boolean }) => void,
  handleCheckoutSuccess: (result: CheckoutResult) => void,
  cartCount: number,
  cartItems: Record<string, CartItem>,
  favoriteSkuIds: string[],
  toggleFavoriteSku: (skuId: string) => void,
  addToCart: (item: CartItem) => void,
  removeCartItem: (cartKey: string) => void,
  meScrollY: number,
  onMeScrollYChange: (offsetY: number) => void,
  onOpenPickupOrders: () => void,
  onOpenMap: () => void,
  onViewAllProducts: () => void,
  themeId: AppThemeId,
  onSelectTheme: (themeId: AppThemeId) => void,
  productDisplayPreferences: ProductDisplayPreferences,
  onSelectProductDisplayDefaultMode: (mode: ProductDisplayMode) => void,
  onSelectProductDisplayPreference: (area: ProductDisplayArea, mode: ProductDisplayOverride) => void,
  defaultPaymentMethod: PaymentMethodId,
  onSetDefaultPaymentMethod: (methodId: PaymentMethodId) => void,
  addedPaymentMethodIds: PaymentMethodId[],
  onSetAddedPaymentMethodIds: (ids: PaymentMethodId[] | ((ids: PaymentMethodId[]) => PaymentMethodId[])) => void,
  savedPaymentCards: SavedPaymentCard[],
  onSetSavedPaymentCards: (cards: SavedPaymentCard[] | ((cards: SavedPaymentCard[]) => SavedPaymentCard[])) => void,
  currentPaymentCardId: string,
  onSetCurrentPaymentCardId: (cardId: string) => void,
  systemPaymentMethodIds: PaymentMethodId[],
  onShowToast: (toast: AppToastMessage, duration?: number) => void,
  qaCashierFailureEnabled: boolean,
  onChangeQaCashierFailure: (enabled: boolean) => void,
  pointsInstantRedeemEnabled: boolean,
  onChangePointsInstantRedeem: (enabled: boolean) => void,
  onResetDemoState: () => void
) {
  const openCheckout = (items: CartItem[]) => {
    setCheckoutPayment(defaultPaymentMethod);
    setCheckoutBenefitAsset(null);
    setCheckoutItems(items);
  };
  const openCouponAssets = (asset: CouponAssetTarget | null = null, filter: RewardFilter = "All") => {
    setActiveCouponAsset(asset);
    setCouponInitialFilter(filter);
    setIsCouponListOpen(true);
  };
  const closeHomeSurfaces = () => {
    setIsCouponListOpen(false);
    setActiveCouponAsset(null);
    setCouponInitialFilter("All");
    setIsPartnerOffersOpen(false);
    setActivePartnerOfferId(null);
    setCashierPartnerOffer(null);
    setCashierCheckout(null);
    setCashierRecentCard(null);
    setCashierCardId("");
    setCashierTopUp(null);
    setCashierGift(null);
    setIsBenefitListOpen(false);
    setIsTopUpOpen(false);
    setIsMissionsOpen(false);
    setIsPointsOpen(false);
    setIsPartnerBenefitsOpen(false);
  };
  const closeMeSurfaces = () => {
    setIsCouponListOpen(false);
    setActiveCouponAsset(null);
    setCouponInitialFilter("All");
    setIsBenefitListOpen(false);
    setIsTierOpen(false);
    setIsExpHistoryOpen(false);
    setIsMissionsOpen(false);
    setIsPointsOpen(false);
    setIsPartnerBenefitsOpen(false);
    setIsAttentionOpen(false);
    setIsGiftHistoryOpen(false);
    setIsTopUpOpen(false);
    setActivityTab(null);
  };
  const openRootTab = (tab: TabKey) => {
    setActiveTab(tab);
    setActiveVMId(null);
    setActiveSkuId(null);
    setIsCartOpen(false);
    setActiveHomeOrderId(null);
    setActiveHomeOrderReturnTarget("home");
    setActivePaymentMode(null);
    setCheckoutBenefitAsset(null);
    setCheckoutItems(null);
    closeHomeSurfaces();
    closeMeSurfaces();
  };
  const activeHomeOrder = orders.find((order) => order.id === activeHomeOrderId);
  if (activeHomeOrder) {
    const backLabel =
      activeHomeOrderReturnTarget === "attention"
        ? "Back to Needs Attention"
        : activeHomeOrderReturnTarget === "orders"
          ? "Back to Orders"
          : "Back to Home";
    return (
      <OrderDetailScreen
        order={activeHomeOrder}
        backLabel={backLabel}
        onBack={() => {
          setActiveHomeOrderId(null);
          if (activeHomeOrderReturnTarget === "attention") {
            setIsAttentionOpen(true);
          } else if (activeHomeOrderReturnTarget === "orders") {
            setActiveTab("me");
            setActivityReadyOnly(false);
            setActivityTab("Orders");
          }
          setActiveHomeOrderReturnTarget("home");
        }}
      />
    );
  }

  if (checkoutItems) {
    if (checkoutBenefitAsset) {
      return (
        <CouponListScreen
          claimedCouponIds={claimedCouponIds}
          purchasedPartnerOffers={purchasedPartnerOffers}
          redeemedPointRewards={redeemedPointRewards}
          usedBenefitIds={usedBenefitIds}
          usedBenefitRecords={usedBenefitRecords}
          initialAsset={checkoutBenefitAsset}
          initialFilter="All"
          onBack={() => setCheckoutBenefitAsset(null)}
        />
      );
    }
    return (
      <CheckoutScreen
        items={checkoutItems}
        walletBalance={walletBalance}
        walletBalances={walletBalances}
        pointsBalance={pointsBalance}
        pointsInstantRedeemEnabled={pointsInstantRedeemEnabled}
        xpBalance={xpBalance}
        claimedCouponIds={claimedCouponIds}
        redeemedPointRewards={redeemedPointRewards}
        usedBenefitIds={usedBenefitIds}
        onOpenBenefitAsset={setCheckoutBenefitAsset}
        onOpenCashier={(request) => {
          setCashierPayment(getEligibleDefaultPaymentMethod(defaultPaymentMethod, "checkout"));
          setCashierCardId(currentPaymentCardId);
          setCashierRecentCard(null);
          setCashierCheckout({ request });
        }}
        onShowToast={onShowToast}
        onBack={() => {
          setCheckoutBenefitAsset(null);
          setCheckoutItems(null);
        }}
      />
    );
  }

  switch (activeTab) {
    case "home":
      if (isTopUpOpen) {
        return (
          <TopUpScreen
            walletBalance={walletBalance}
            walletBalances={walletBalances}
            bonusSummary={bonusSummary}
            xpBalance={xpBalance}
            autoReloadSettings={autoReloadSettings}
            onChangeAutoReloadSettings={onChangeAutoReloadSettings}
            onBack={() => setIsTopUpOpen(false)}
            onOpenCashier={(result) => {
              setCashierPayment(getEligibleDefaultPaymentMethod(defaultPaymentMethod, "topup"));
              setCashierCardId(currentPaymentCardId);
              setCashierRecentCard(null);
              setCashierTopUp(result);
            }}
          />
        );
      }
      if (isMissionsOpen) {
        return (
          <MissionsScreen
            onBack={() => setIsMissionsOpen(false)}
            checkInStreak={checkInStreak}
            checkedInToday={lastCheckInDate === getLocalDateKey()}
            addFundsTotal={getFirstTopUpAmount(paymentHistory)}
            addFundsXpTotal={getFirstXpAmount(xpHistory, "Wallet")}
            appPurchaseCount={orders.filter((order) => order.orderMode === "app_preorder").length}
            appPurchaseXpTotal={getFirstXpAmount(xpHistory, "Purchase")}
            sentGiftCount={sentGifts.length}
            xpBalance={xpBalance}
            onDailyCheckIn={() =>
              handleXpAction("daily-check-in", `daily-check-in:${getLocalDateKey()}`)
            }
            onOpenTopUp={() => {
              closeHomeSurfaces();
              setIsTopUpOpen(true);
            }}
            onOpenOrder={() => {
              openRootTab("category");
            }}
            onOpenGift={() => {
              openRootTab("gift");
            }}
          />
        );
      }
      const pendingHomeOrders = orders.filter(
        (order) => order.orderMode === "app_preorder" && order.status === "Ready to collect"
      );
      const attentionItems = createImmediateActions({
        pendingOrders: pendingHomeOrders,
        purchasedPartnerOffers,
        redeemedPointRewards,
        claimedCouponIds,
        usedBenefitIds,
        onOpenOrder: (orderId) => {
          setIsAttentionOpen(false);
          setActiveHomeOrderReturnTarget("attention");
          setActiveHomeOrderId(orderId);
        },
        onOpenPartnerVoucher: (voucherCode) => {
          setIsAttentionOpen(false);
          openCouponAssets({ type: "partnerVoucher", id: voucherCode });
        },
        onOpenVoucher: (voucherId) => {
          setIsAttentionOpen(false);
          openCouponAssets({ type: "voucher", id: voucherId });
        },
        onOpenPointReward: (rewardId) => {
          setIsAttentionOpen(false);
          openCouponAssets({ type: "pointReward", id: rewardId });
        },
        onOpenCoupon: (couponId) => {
          setIsAttentionOpen(false);
          openCouponAssets({ type: "coupon", id: couponId });
        },
        onOpenTopUp: () => {
          setIsAttentionOpen(false);
          setIsTopUpOpen(true);
        },
        cashBalance,
        autoReloadThreshold: autoReloadSettings.threshold,
        autoReloadEnabled: autoReloadSettings.enabled
      });
      if (isAttentionOpen) {
        return (
          <NeedsAttentionScreen
            items={attentionItems}
            dismissedAttentionIds={dismissedAttentionIds}
            onDismiss={onDismissAttention}
            onBack={() => setIsAttentionOpen(false)}
          />
        );
      }
      if (isCouponListOpen) {
        return (
          <CouponListScreen
            claimedCouponIds={claimedCouponIds}
            purchasedPartnerOffers={purchasedPartnerOffers}
            redeemedPointRewards={redeemedPointRewards}
            usedBenefitIds={usedBenefitIds}
            usedBenefitRecords={usedBenefitRecords}
            initialAsset={activeCouponAsset}
            initialFilter={couponInitialFilter}
            onBack={() => {
              setActiveCouponAsset(null);
              setCouponInitialFilter("All");
              setIsCouponListOpen(false);
            }}
          />
        );
      }
      if (isPartnerOffersOpen) {
        return (
          <PartnerOffersScreen
            initialOfferId={activePartnerOfferId}
            claimedCouponIds={claimedCouponIds}
            pointsBalance={pointsBalance}
            pointsInstantRedeemEnabled={pointsInstantRedeemEnabled}
            onClaimCoupon={handleClaimCoupon}
            onPurchaseOffer={handlePurchasePartnerOffer}
            offerDisplayMode={resolveProductDisplayMode(productDisplayPreferences, "allPartnerOffers")}
            onBack={() => {
              setActivePartnerOfferId(null);
              setIsPartnerOffersOpen(false);
            }}
          />
        );
      }
      if (isBenefitListOpen) {
        return <BenefitListScreen onBack={() => setIsBenefitListOpen(false)} xpBalance={xpBalance} />;
      }
      if (isCartOpen) {
        return (
          <CartScreen
            cartItems={cartItems}
            onRemoveItem={removeCartItem}
            onCheckout={openCheckout}
            onBack={() => setIsCartOpen(false)}
            xpBalance={xpBalance}
            onShowToast={onShowToast}
          />
        );
      }
      if (activeSkuId) {
        return (
          <SkuDetailScreen
            skuId={activeSkuId}
            cartCount={cartCount}
            isFavorite={favoriteSkuIds.includes(activeSkuId)}
            onToggleFavorite={toggleFavoriteSku}
            onAddToCart={addToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onBuyNow={(item) => openCheckout([item])}
            onBack={() => setActiveSkuId(null)}
            xpBalance={xpBalance}
            onShowToast={onShowToast}
          />
        );
      }
      return (
          <HomeScreen
          userName={userProfile.name}
          onOpenSku={setActiveSkuId}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenMe={() => {
            setMeInitialPage(null);
            openRootTab("me");
          }}
          onOpenCoupons={() => openCouponAssets()}
          onOpenPartnerOffers={(offerId) => {
            setActivePartnerOfferId(offerId ?? null);
            setIsPartnerOffersOpen(true);
          }}
          onOpenTopUp={() => setIsTopUpOpen(true)}
          onOpenGift={() => {
            openRootTab("gift");
          }}
          onOpenMissions={() => {
            closeHomeSurfaces();
            setIsMissionsOpen(true);
          }}
          onOpenMap={onOpenMap}
          claimedCouponIds={claimedCouponIds}
          usedBenefitIds={usedBenefitIds}
          onClaimCoupon={handleClaimCoupon}
          onViewAllProducts={onViewAllProducts}
          pendingOrders={pendingHomeOrders}
          purchasedPartnerOffers={purchasedPartnerOffers}
          redeemedPointRewards={redeemedPointRewards}
          onOpenOrder={(orderId) => {
            setActiveHomeOrderReturnTarget("home");
            setActiveHomeOrderId(orderId);
          }}
          onOpenPartnerVoucher={(voucherCode) => openCouponAssets({ type: "partnerVoucher", id: voucherCode })}
          onOpenVoucher={(voucherId) => openCouponAssets({ type: "voucher", id: voucherId })}
          onOpenPointReward={(rewardId) => openCouponAssets({ type: "pointReward", id: rewardId })}
          onOpenCoupon={(couponId) => openCouponAssets({ type: "coupon", id: couponId })}
          onViewAllAttention={() => setIsAttentionOpen(true)}
          dismissedAttentionIds={dismissedAttentionIds}
          onDismissAttention={onDismissAttention}
          cashBalance={cashBalance}
          autoReloadThreshold={autoReloadSettings.threshold}
          autoReloadEnabled={autoReloadSettings.enabled}
          cartCount={cartCount}
          xpBalance={xpBalance}
          productDisplayMode={resolveProductDisplayMode(productDisplayPreferences, "homeBestSellers")}
          partnerOfferDisplayMode={resolveProductDisplayMode(productDisplayPreferences, "homePartnerOffers")}
        />
      );
    case "category":
      if (isCartOpen) {
        return (
          <CartScreen
            cartItems={cartItems}
            onRemoveItem={removeCartItem}
            onCheckout={openCheckout}
            onBack={() => setIsCartOpen(false)}
            xpBalance={xpBalance}
            onShowToast={onShowToast}
          />
        );
      }
      if (activeSkuId) {
        return (
          <SkuDetailScreen
            skuId={activeSkuId}
            cartCount={cartCount}
            isFavorite={favoriteSkuIds.includes(activeSkuId)}
            onToggleFavorite={toggleFavoriteSku}
            onAddToCart={addToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onBuyNow={(item) => openCheckout([item])}
            onBack={() => setActiveSkuId(null)}
            xpBalance={xpBalance}
            onShowToast={onShowToast}
          />
        );
      }
      return (
        <CategoryScreen
          onOpenSku={setActiveSkuId}
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={cartCount}
          favoriteSkuIds={favoriteSkuIds}
          xpBalance={xpBalance}
          productDisplayMode={resolveProductDisplayMode(productDisplayPreferences, "orderAllMenu")}
        />
      );
    case "scan":
      return <ScanPayScreen />;
    case "rewards":
      if (isTierOpen) {
        return (
          <TierScreen
            onBack={() => setIsTierOpen(false)}
            onOpenExpHistory={() => setIsExpHistoryOpen(true)}
            xpBalance={xpBalance}
            xpHistory={xpHistory}
          />
        );
      }
      if (isPointsOpen) {
        return (
          <PointsScreen
            pointsBalance={pointsBalance}
            paymentHistory={paymentHistory}
            xpBalance={xpBalance}
            onRedeemPoints={handleRedeemPoints}
            onBack={() => setIsPointsOpen(false)}
            backLabel="Back to Rewards"
          />
        );
      }
      if (isPartnerBenefitsOpen) {
        return (
          <PartnerBenefitsScreen
            claimedCouponCount={claimedCouponIds.length}
            onBack={() => setIsPartnerBenefitsOpen(false)}
            onOpenPartnerOffers={() => {
              setIsPartnerBenefitsOpen(false);
              setActivePartnerOfferId(null);
              setIsPartnerOffersOpen(true);
            }}
            backLabel="Back to Rewards"
          />
        );
      }
      if (isMissionsOpen) {
        return (
          <MissionsScreen
            onBack={() => setIsMissionsOpen(false)}
            checkInStreak={checkInStreak}
            checkedInToday={lastCheckInDate === getLocalDateKey()}
            addFundsTotal={getFirstTopUpAmount(paymentHistory)}
            addFundsXpTotal={getFirstXpAmount(xpHistory, "Wallet")}
            appPurchaseCount={orders.filter((order) => order.orderMode === "app_preorder").length}
            appPurchaseXpTotal={getFirstXpAmount(xpHistory, "Purchase")}
            sentGiftCount={sentGifts.length}
            xpBalance={xpBalance}
            onDailyCheckIn={() =>
              handleXpAction("daily-check-in", `daily-check-in:${getLocalDateKey()}`)
            }
            onOpenTopUp={() => {
              closeMeSurfaces();
              setIsTopUpOpen(true);
            }}
            onOpenOrder={() => {
              openRootTab("category");
            }}
            onOpenGift={() => {
              openRootTab("gift");
            }}
          />
        );
      }
      if (isCouponListOpen) {
        return (
          <CouponListScreen
            claimedCouponIds={claimedCouponIds}
            purchasedPartnerOffers={purchasedPartnerOffers}
            redeemedPointRewards={redeemedPointRewards}
            usedBenefitIds={usedBenefitIds}
            usedBenefitRecords={usedBenefitRecords}
            initialAsset={activeCouponAsset}
            initialFilter={couponInitialFilter}
            onBack={() => {
              setActiveCouponAsset(null);
              setCouponInitialFilter("All");
              setIsCouponListOpen(false);
            }}
          />
        );
      }
      if (isPartnerOffersOpen) {
        return (
          <PartnerOffersScreen
            initialOfferId={activePartnerOfferId}
            claimedCouponIds={claimedCouponIds}
            pointsBalance={pointsBalance}
            pointsInstantRedeemEnabled={pointsInstantRedeemEnabled}
            onClaimCoupon={handleClaimCoupon}
            onPurchaseOffer={handlePurchasePartnerOffer}
            offerDisplayMode={resolveProductDisplayMode(productDisplayPreferences, "allPartnerOffers")}
            onBack={() => {
              setActivePartnerOfferId(null);
              setIsPartnerOffersOpen(false);
            }}
          />
        );
      }
      if (isBenefitListOpen) {
        return <BenefitListScreen onBack={() => setIsBenefitListOpen(false)} xpBalance={xpBalance} />;
      }
      return (
        <RewardsScreen
          pointsBalance={pointsBalance}
          xpBalance={xpBalance}
          claimedCouponCount={claimedCouponIds.length}
          redeemedRewardCount={redeemedPointRewards.length}
          purchasedPartnerOfferCount={purchasedPartnerOffers.length}
          activeMissionCount={getActiveMissionCount({
            checkedInToday: lastCheckInDate === getLocalDateKey(),
            addFundsTotal: getFirstTopUpAmount(paymentHistory),
            appPurchaseCount: orders.filter((order) => order.orderMode === "app_preorder").length,
            sentGiftCount: sentGifts.length
          })}
          onOpenMyRewards={() => openCouponAssets()}
          onOpenPoints={() => setIsPointsOpen(true)}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenPartnerOffers={() => {
            setActivePartnerOfferId(null);
            setIsPartnerOffersOpen(true);
          }}
          onOpenMemberGrowth={() => setIsTierOpen(true)}
          onOpenBenefits={() => setIsBenefitListOpen(true)}
          onOpenPartnerBenefits={() => setIsPartnerBenefitsOpen(true)}
          onOpenHistory={() => setIsPointsOpen(true)}
        />
      );
    case "map":
      if (activeVMId) {
        return <VMDetailScreen vmId={activeVMId} onBack={() => setActiveVMId(null)} />;
      }
      return <VMMapScreen onOpenVM={setActiveVMId} />;
    case "gift":
      if (isGiftHistoryOpen) {
        return <GiftHistoryScreen gifts={sentGifts} onShowToast={onShowToast} onBack={() => setIsGiftHistoryOpen(false)} />;
      }
      return (
        <GiftScreen
          walletBalance={walletBalance}
          friends={friends}
          pointsBalance={pointsBalance}
          pointsInstantRedeemEnabled={pointsInstantRedeemEnabled}
          onOpenSentGifts={() => {
            setIsGiftHistoryOpen(true);
          }}
          onOpenCashier={(request, callbacks) => {
            const hasExplicitBenefits = request.benefitsApplied !== undefined || request.pointsRedeemed !== undefined || request.payableAmount !== undefined;
            const pointsBenefit = hasExplicitBenefits
              ? {
                  payableAmount: request.payableAmount ?? request.amount,
                  benefitsApplied: request.benefitsApplied ?? [],
                  pointsRedeemed: request.pointsRedeemed ?? 0
                }
              : calculateInstantPointsBenefit(request.amount, pointsBalance);
            setCashierPayment(getEligibleDefaultPaymentMethod(defaultPaymentMethod, "gift"));
            setCashierCardId(currentPaymentCardId);
            setCashierRecentCard(null);
            setCashierGift({
              request: {
                ...request,
                payableAmount: pointsBenefit.payableAmount,
                benefitsApplied: pointsBenefit.benefitsApplied,
                pointsRedeemed: pointsBenefit.pointsRedeemed
              },
              ...callbacks
            });
          }}
          onShowToast={onShowToast}
          xpBalance={xpBalance}
        />
      );
    case "me":
      if (activityTab) {
        return (
          <ActivityScreen
            initialTab={activityTab}
            initialReadyOnly={activityReadyOnly}
            walletBalance={walletBalance}
            walletBalances={walletBalances}
            bonusSummary={bonusSummary}
            xpBalance={xpBalance}
            orders={orders}
            paymentHistory={paymentHistory}
            walletHistory={walletHistory}
            onBack={() => setActivityTab(null)}
          />
        );
      }
      if (isTopUpOpen) {
        return (
          <TopUpScreen
            walletBalance={walletBalance}
            walletBalances={walletBalances}
            bonusSummary={bonusSummary}
            xpBalance={xpBalance}
            autoReloadSettings={autoReloadSettings}
            onChangeAutoReloadSettings={onChangeAutoReloadSettings}
            onBack={() => setIsTopUpOpen(false)}
            backLabel="Back to Me"
            onOpenCashier={(result) => {
              setCashierPayment(getEligibleDefaultPaymentMethod(defaultPaymentMethod, "topup"));
              setCashierCardId(currentPaymentCardId);
              setCashierRecentCard(null);
              setCashierTopUp(result);
            }}
          />
        );
      }
      if (isExpHistoryOpen) {
        return (
          <ExpHistoryScreen
            onBack={() => setIsExpHistoryOpen(false)}
            xpBalance={xpBalance}
            xpHistory={xpHistory}
          />
        );
      }
      if (isMissionsOpen) {
        return (
          <MissionsScreen
            onBack={() => setIsMissionsOpen(false)}
            checkInStreak={checkInStreak}
            checkedInToday={lastCheckInDate === getLocalDateKey()}
            addFundsTotal={getFirstTopUpAmount(paymentHistory)}
            addFundsXpTotal={getFirstXpAmount(xpHistory, "Wallet")}
            appPurchaseCount={orders.filter((order) => order.orderMode === "app_preorder").length}
            appPurchaseXpTotal={getFirstXpAmount(xpHistory, "Purchase")}
            sentGiftCount={sentGifts.length}
            xpBalance={xpBalance}
            onDailyCheckIn={() =>
              handleXpAction("daily-check-in", `daily-check-in:${getLocalDateKey()}`)
            }
            onOpenTopUp={() => {
              closeMeSurfaces();
              setIsTopUpOpen(true);
            }}
            onOpenOrder={() => {
              openRootTab("category");
            }}
            onOpenGift={() => {
              openRootTab("gift");
            }}
          />
        );
      }
      if (isTierOpen) {
        return (
          <TierScreen
            onBack={() => setIsTierOpen(false)}
            onOpenExpHistory={() => setIsExpHistoryOpen(true)}
            xpBalance={xpBalance}
            xpHistory={xpHistory}
          />
        );
      }
      if (isCouponListOpen) {
        return (
          <CouponListScreen
            claimedCouponIds={claimedCouponIds}
            purchasedPartnerOffers={purchasedPartnerOffers}
            redeemedPointRewards={redeemedPointRewards}
            usedBenefitIds={usedBenefitIds}
            usedBenefitRecords={usedBenefitRecords}
            initialAsset={activeCouponAsset}
            initialFilter={couponInitialFilter}
            onBack={() => {
              setActiveCouponAsset(null);
              setCouponInitialFilter("All");
              setIsCouponListOpen(false);
            }}
          />
        );
      }
      if (isBenefitListOpen) {
        return <BenefitListScreen onBack={() => setIsBenefitListOpen(false)} xpBalance={xpBalance} />;
      }
      return (
          <MeScreen
            profile={userProfile}
            initialPage={meInitialPage}
            onSaveProfile={setUserProfile}
            onOpenVouchers={() => openCouponAssets(null, "Vouchers")}
            onOpenCoupons={() => openCouponAssets(null, "Coupons")}
            onOpenBenefits={() => setIsBenefitListOpen(true)}
            onOpenPartnerOffers={() => {
              closeMeSurfaces();
              setActiveTab("home");
              setIsPartnerOffersOpen(true);
            }}
            onOpenTier={() => setIsTierOpen(true)}
          onOpenMissions={() => setIsMissionsOpen(true)}
          onOpenTopUp={() => {
            closeMeSurfaces();
            setIsTopUpOpen(true);
          }}
          onOpenActivity={(tab) => {
            closeMeSurfaces();
            setActivityReadyOnly(false);
            setActivityTab(tab);
          }}
          walletBalance={walletBalance}
          walletBalances={walletBalances}
          bonusSummary={bonusSummary}
          autoReloadSettings={autoReloadSettings}
          onChangeAutoReloadSettings={onChangeAutoReloadSettings}
          pointsBalance={pointsBalance}
          paymentHistory={paymentHistory}
          xpBalance={xpBalance}
          onRedeemPoints={handleRedeemPoints}
          claimedCouponCount={claimedCouponIds.length}
          initialScrollY={meScrollY}
          onScrollYChange={onMeScrollYChange}
          themeId={themeId}
          onSelectTheme={onSelectTheme}
          productDisplayPreferences={productDisplayPreferences}
          onSelectProductDisplayDefaultMode={onSelectProductDisplayDefaultMode}
          onSelectProductDisplayPreference={onSelectProductDisplayPreference}
          defaultPaymentMethod={defaultPaymentMethod}
          onSetDefaultPaymentMethod={onSetDefaultPaymentMethod}
          addedPaymentMethodIds={addedPaymentMethodIds}
          onSetAddedPaymentMethodIds={onSetAddedPaymentMethodIds}
          savedCards={savedPaymentCards}
          onSetSavedCards={onSetSavedPaymentCards}
          currentCardId={currentPaymentCardId}
          onSetCurrentCardId={onSetCurrentPaymentCardId}
          systemPaymentMethodIds={systemPaymentMethodIds}
          onShowToast={onShowToast}
          qaCashierFailureEnabled={qaCashierFailureEnabled}
          onChangeQaCashierFailure={onChangeQaCashierFailure}
          pointsInstantRedeemEnabled={pointsInstantRedeemEnabled}
          onChangePointsInstantRedeem={onChangePointsInstantRedeem}
          onResetDemoState={onResetDemoState}
        />
      );
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [rootTabResetVersions, setRootTabResetVersions] = useState<Record<TabKey, number>>({
    home: 0,
    category: 0,
    scan: 0,
    gift: 0,
    rewards: 0,
    map: 0,
    me: 0
  });
  const [activeVMId, setActiveVMId] = useState<string | null>(null);
  const [activeSkuId, setActiveSkuId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCouponListOpen, setIsCouponListOpen] = useState(false);
  const [activeCouponAsset, setActiveCouponAsset] = useState<CouponAssetTarget | null>(null);
  const [couponInitialFilter, setCouponInitialFilter] = useState<RewardFilter>("All");
  const [isPartnerOffersOpen, setIsPartnerOffersOpen] = useState(false);
  const [activePartnerOfferId, setActivePartnerOfferId] = useState<string | null>(null);
  const [cashierPartnerOffer, setCashierPartnerOffer] = useState<PartnerOffer | null>(null);
  const [cashierPartnerBenefit, setCashierPartnerBenefit] = useState<InstantPointsBenefit | null>(null);
  const [cashierTopUp, setCashierTopUp] = useState<Omit<TopUpResult, "paymentMethodId"> | null>(null);
  const [cashierGift, setCashierGift] = useState<PendingGiftCashier | null>(null);
  const [cashierCheckout, setCashierCheckout] = useState<PendingCheckoutCashier | null>(null);
  const [cashierRecentCard, setCashierRecentCard] = useState<SavedPaymentCard | null>(null);
  const [cashierCardId, setCashierCardId] = useState("");
  const [qaCashierFailureEnabled, setQaCashierFailureEnabled] = useState(false);
  const [pointsInstantRedeemEnabled, setPointsInstantRedeemEnabled] = useState(true);
  const [isBenefitListOpen, setIsBenefitListOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isTierOpen, setIsTierOpen] = useState(false);
  const [isExpHistoryOpen, setIsExpHistoryOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isPartnerBenefitsOpen, setIsPartnerBenefitsOpen] = useState(false);
  const [isAttentionOpen, setIsAttentionOpen] = useState(false);
  const [isGiftHistoryOpen, setIsGiftHistoryOpen] = useState(false);
  const [dismissedAttentionIds, setDismissedAttentionIds] = useState<string[]>([]);
  const [activityTab, setActivityTab] = useState<ActivityTab | null>(null);
  const [activityReadyOnly, setActivityReadyOnly] = useState(false);
  const [meInitialPage, setMeInitialPage] = useState<"points" | null>(null);
  const [activeHomeOrderId, setActiveHomeOrderId] = useState<string | null>(null);
  const [activeHomeOrderReturnTarget, setActiveHomeOrderReturnTarget] = useState<OrderDetailReturnTarget>("home");
  const [activePaymentMode, setActivePaymentMode] = useState<PaymentMethodMode | null>(null);
  const [activePaymentInitialPage, setActivePaymentInitialPage] = useState<"list" | "add-method">("list");
  const [activePaymentPayable, setActivePaymentPayable] = useState(0);
  const [activePaymentPoints, setActivePaymentPoints] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile>(defaultProfile);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[] | null>(null);
  const [checkoutBenefitAsset, setCheckoutBenefitAsset] = useState<CouponAssetTarget | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethodId>("wallet");
  const [topUpPayment, setTopUpPayment] = useState<PaymentMethodId>("card");
  const [giftPayment, setGiftPayment] = useState<PaymentMethodId>("wallet");
  const [cashierPayment, setCashierPayment] = useState<PaymentMethodId>("wallet");
  const [addedPaymentMethodIds, setAddedPaymentMethodIds] = useState<PaymentMethodId[]>(["wallet", "card"]);
  const [savedPaymentCards, setSavedPaymentCards] = useState<SavedPaymentCard[]>(createDefaultSavedPaymentCards);
  const [currentPaymentCardId, setCurrentPaymentCardId] = useState("visa-4242");
  const [appState, setAppState] = useState(createInitialAppState);
  const [isStateHydrated, setIsStateHydrated] = useState(false);
  const [expToast, setExpToast] = useState<ExpToast | null>(null);
  const [expDisplayAmount, setExpDisplayAmount] = useState(0);
  const [appToast, setAppToast] = useState<AppToastMessage | null>(null);
  const {
    cashBalance,
    rewardsBonusBalance,
    pointsBalance,
    xpBalance,
    xpHistory,
    checkInStreak,
    lastCheckInDate,
    orders,
    paymentHistory,
    walletHistory,
    cartItems,
    favoriteSkuIds,
    claimedCouponIds,
    purchasedPartnerOffers,
    redeemedPointRewards,
    usedBenefitIds,
    usedBenefitRecords,
    themeId,
    productDisplayPreferences,
    defaultPaymentMethod,
    autoReloadSettings,
    sentGifts,
    friends
  } = appState;
  const walletBalance = cashBalance + rewardsBonusBalance;
  const walletBalances = { cash: cashBalance, rewardsBonus: rewardsBonusBalance };
  const bonusSummary = calculateBonusSummary(walletHistory, walletBalances);
  const meScrollYRef = useRef(0);
  const expToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expCountTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expToastAnimation = useRef(new Animated.Value(0)).current;

  function handleDismissAttention(itemId: string) {
    setDismissedAttentionIds((ids) => ids.includes(itemId) ? ids : [itemId, ...ids]);
    showAppToast({
      tone: "info",
      title: "Hidden for now",
      message: "This does not turn off future reminders.",
      icon: "eye-off-outline"
    }, 3000);
  }

  const cartCount = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
  const systemPaymentMethodIds: PaymentMethodId[] =
    Platform.OS === "ios" ? ["apple-pay"] : Platform.OS === "android" ? ["google-pay"] : [];
  const availablePaymentMethods = getAvailablePaymentMethods({
    addedPaymentMethodIds,
    currentCardId: currentPaymentCardId,
    savedCards: savedPaymentCards,
    systemPaymentMethodIds
  });
  const cashierAvailablePaymentMethods = getCashierAvailablePaymentMethods(availablePaymentMethods, cashierRecentCard);
  const cashierSavedCards = getCashierSavedCards(savedPaymentCards, cashierRecentCard);

  useEffect(() => {
    let isMounted = true;
    loadPersistedAppState().then((persistedState) => {
      if (!isMounted) {
        return;
      }
      if (persistedState) {
        const restoredState = expireEligibleOrders(persistedState, Date.now());
        setAppState(restoredState);
        setCheckoutPayment(restoredState.defaultPaymentMethod);
        setGiftPayment(restoredState.defaultPaymentMethod);
        setTopUpPayment(
          getEligibleDefaultPaymentMethod(restoredState.defaultPaymentMethod, "topup")
        );
      }
      setIsStateHydrated(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isStateHydrated) {
      void savePersistedAppState(appState);
    }
  }, [appState, isStateHydrated]);

  useEffect(() => {
    return () => {
      if (expToastTimerRef.current) {
        clearTimeout(expToastTimerRef.current);
      }
      if (appToastTimerRef.current) {
        clearTimeout(appToastTimerRef.current);
      }
      if (expCountTimerRef.current) {
        clearInterval(expCountTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isStateHydrated) {
      return undefined;
    }

    const expireOrders = () => {
      setAppState((state) => expireEligibleOrders(state, Date.now()));
    };
    expireOrders();
    const timer = setInterval(expireOrders, 1000);
    return () => clearInterval(timer);
  }, [isStateHydrated]);

  useEffect(() => {
    if (cashierTopUp && cashierPayment === "wallet") {
      setCashierPayment(getEligibleDefaultPaymentMethod(defaultPaymentMethod, "topup"));
    }
  }, [cashierTopUp, cashierPayment, defaultPaymentMethod]);

  useEffect(() => {
    if (!expToast) {
      return;
    }
    expToastAnimation.setValue(0);
    setExpDisplayAmount(0);
    Animated.timing(expToastAnimation, {
      toValue: 1,
      duration: 760,
      useNativeDriver: true
    }).start();

    const startedAt = Date.now();
    const duration = 1800;
    if (expCountTimerRef.current) {
      clearInterval(expCountTimerRef.current);
    }
    expCountTimerRef.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      setExpDisplayAmount(Math.round(expToast.amount * progress));
      if (progress >= 1 && expCountTimerRef.current) {
        clearInterval(expCountTimerRef.current);
        expCountTimerRef.current = null;
      }
    }, 30);

    return () => {
      if (expCountTimerRef.current) {
        clearInterval(expCountTimerRef.current);
        expCountTimerRef.current = null;
      }
    };
  }, [expToast, expToastAnimation]);

  function addToCart(item: CartItem) {
    const stock = skus.find((sku) => sku.id === item.skuId)?.stock;
    setAppState((state) => addCartItem(state, item, stock));
  }

  function removeCartItem(cartKey: string) {
    setAppState((state) => removeCartItemFromState(state, cartKey));
  }

  function toggleFavoriteSku(skuId: string) {
    setAppState((state) => toggleFavorite(state, skuId));
  }

  function showExpToast(record: XpRecord, amount: number) {
    if (expToastTimerRef.current) {
      clearTimeout(expToastTimerRef.current);
    }
    if (expCountTimerRef.current) {
      clearInterval(expCountTimerRef.current);
      expCountTimerRef.current = null;
    }
    setExpToast({
      amount,
      title: record.title,
      description: record.description,
      type: record.type
    });
    expToastTimerRef.current = setTimeout(() => {
      Animated.timing(expToastAnimation, {
        toValue: 0,
        duration: 1050,
        useNativeDriver: true
      }).start(() => setExpToast(null));
    }, 5200);
  }

  function showAppToast(toast: AppToastMessage, duration = 5000) {
    if (appToastTimerRef.current) {
      clearTimeout(appToastTimerRef.current);
    }
    setAppToast(toast);
    appToastTimerRef.current = setTimeout(() => setAppToast(null), duration);
  }

  function dismissAppToast() {
    if (appToastTimerRef.current) {
      clearTimeout(appToastTimerRef.current);
      appToastTimerRef.current = null;
    }
    setAppToast(null);
  }

  function updateAppStateWithExpToast(
    updater: (state: ReturnType<typeof createInitialAppState>) => ReturnType<typeof createInitialAppState>
  ) {
    setAppState((state) => {
      const nextState = updater(state);
      const amount = nextState.xpBalance - state.xpBalance;
      if (amount > 0) {
        const record =
          nextState.xpHistory.find((item) => !state.xpAwardKeys.includes(item.eventKey)) ??
          nextState.xpHistory[0];
        if (record) {
          showExpToast(record, amount);
        }
      }
      return nextState;
    });
  }

  function handleTopUp(result: TopUpResult, createdAt = Date.now()) {
    updateAppStateWithExpToast((state) => applyTopUp(state, result, createdAt));
  }

  function handleCashierTopUpPayment(): CashierPaymentOutcome | null {
    if (!cashierTopUp) {
      return null;
    }
    const createdAt = Date.now();
    const paymentMethodId: TopUpResult["paymentMethodId"] = cashierPayment === "wallet" ? "card" : cashierPayment;
    handleTopUp({
      ...cashierTopUp,
      paymentMethodId
    }, createdAt);
    const amount = cashierTopUp.amount;
    const rewardsBonus = cashierTopUp.rewardsBonus;
    return {
      title: "Payment Successful",
      message: `${formatCurrency(amount)} paid · ${formatCurrency(amount + rewardsBonus)} added to Wallet eCard`,
      meta: `${formatCurrency(amount)} Cash + ${formatCurrency(rewardsBonus)} Bonus`,
      details: createCashierReceiptDetails("AF", paymentMethodId, createdAt),
      onComplete: () => {
        setCashierTopUp(null);
        setCashierRecentCard(null);
        setCashierCardId("");
        setIsTopUpOpen(false);
      }
    };
  }

  function handleCheckoutSuccess(result: CheckoutResult) {
    const createdAt = Date.now();
    updateAppStateWithExpToast((state) =>
      applyCheckout(state, result, createdAt, (skuId) => skus.find((sku) => sku.id === skuId)?.name)
    );
    setCheckoutItems(null);
    setIsCartOpen(false);
    setActiveHomeOrderReturnTarget("orders");
    setActiveHomeOrderId(`order-${createdAt}`);
  }

  function handleCashierCheckoutPayment(): CashierPaymentOutcome | null {
    if (!cashierCheckout) {
      return null;
    }
    const selectedMethod = getPaymentMethod(cashierPayment);
    const request = cashierCheckout.request;
    const isNoPaymentRequired = request.amount <= 0;
    const createdAt = Date.now();
    updateAppStateWithExpToast((state) =>
      applyCheckout(
        state,
        {
          ...request,
          paymentMethod: isNoPaymentRequired ? "No payment required" : selectedMethod.title,
          paymentMethodId: cashierPayment
        },
        createdAt,
        (skuId) => skus.find((sku) => sku.id === skuId)?.name
      )
    );
    return {
      title: isNoPaymentRequired ? "Order Confirmed" : "Payment Successful",
      message: isNoPaymentRequired
        ? `${request.benefitsApplied?.[0]?.title ?? "Benefits"} applied · Prepaid order created`
        : `${formatCurrency(request.amount)} paid · Prepaid order created`,
      meta: request.pointsRedeemed
        ? `-${request.pointsRedeemed.toLocaleString()} Points`
        : request.points > 0 || request.xpEarned > 0
          ? `+${request.points} Points · +${request.xpEarned} EXP`
          : undefined,
      details: isNoPaymentRequired ? createCashierConfirmationDetails("PAY", createdAt) : createCashierReceiptDetails("PAY", cashierPayment, createdAt),
      onComplete: () => {
        setCashierCheckout(null);
        setCashierRecentCard(null);
        setCashierCardId("");
        setCheckoutItems(null);
        setIsCartOpen(false);
        setActiveSkuId(null);
        setActiveTab("me");
        setActivityReadyOnly(false);
        setActivityTab("Orders");
        setActiveHomeOrderReturnTarget("orders");
        setActiveHomeOrderId(`order-${createdAt}`);
      }
    };
  }

  function handleGiftPurchase(result: GiftPurchaseResult, createdAt = Date.now()) {
    const payableAmount = result.payableAmount ?? result.amount;
    if (result.paymentMethodId === "wallet" && walletBalance < payableAmount) {
      return null;
    }
    updateAppStateWithExpToast((state) => applyGiftPurchase(state, result, createdAt));
    return `GA-${String(createdAt).slice(-4)}-${String(createdAt).slice(-8, -4)}`;
  }

  function handleCashierGiftPayment(): CashierPaymentOutcome | null {
    if (!cashierGift) {
      return null;
    }
    const selectedMethod = getPaymentMethod(cashierPayment);
    const createdAt = Date.now();
    const giftCode = handleGiftPurchase({
      ...cashierGift.request,
      paymentMethod: selectedMethod.title,
      paymentMethodId: cashierPayment
    }, createdAt);
    const callbacks = cashierGift;
    const request = cashierGift.request;
    const payableAmount = request.payableAmount ?? request.amount;
    const isNoPaymentRequired = payableAmount <= 0;
    if (!giftCode) {
      callbacks.onFailure();
      return null;
    }
    return {
      title: isNoPaymentRequired ? "Gift Confirmed" : "Payment Successful",
      message: isNoPaymentRequired
        ? `${request.benefitsApplied?.[0]?.title ?? "Benefits"} applied · Gift sent to ${request.recipientName}`
        : `${formatCurrency(payableAmount)} paid · Gift sent to ${request.recipientName}`,
      meta: request.pointsRedeemed
        ? `-${request.pointsRedeemed.toLocaleString()} Points`
        : `${selectedMethod.title} confirmed`,
      details: isNoPaymentRequired ? createCashierConfirmationDetails("GFT", createdAt) : createCashierReceiptDetails("GFT", cashierPayment, createdAt),
      onComplete: () => {
        setCashierGift(null);
        setCashierRecentCard(null);
        setCashierCardId("");
        callbacks.onSuccess(giftCode);
      }
    };
  }

  function handleClaimCoupon(couponId: string) {
    setAppState((state) => claimCoupon(state, couponId));
    showAppToast({
      tone: "success",
      title: "Coupon added",
      message: "You can find it in My Rewards.",
      icon: "ticket-outline",
      actionLabel: "View",
      onAction: () => {
        setActiveCouponAsset({ type: "coupon", id: couponId });
        setIsCouponListOpen(true);
      }
    });
  }

  function handlePurchasePartnerOffer(offer: PartnerOffer, options: { usePointsBenefit?: boolean } = { usePointsBenefit: true }) {
    const amount = parseCurrency(offer.price ?? "$0");
    const pointsBenefit = options.usePointsBenefit === false
      ? { payableAmount: amount, pointsRedeemed: 0, benefitsApplied: [] }
      : calculateInstantPointsBenefit(amount, pointsBalance);
    setCashierPayment(getEligibleDefaultPaymentMethod(defaultPaymentMethod, "checkout"));
    setCashierCardId(currentPaymentCardId);
    setCashierRecentCard(null);
    setCashierPartnerBenefit(pointsBenefit);
    setCashierPartnerOffer(offer);
  }

  function handleCashierPartnerOfferPayment(): CashierPaymentOutcome | null {
    if (!cashierPartnerOffer) {
      return null;
    }
    const offer = cashierPartnerOffer;
    const amount = cashierPartnerBenefit?.payableAmount ?? parseCurrency(offer.price ?? "$0");
    const selectedMethod = getPaymentMethod(cashierPayment);
    if (cashierPayment === "wallet" && cashBalance < amount) {
      showAppToast({
        tone: "warning",
        title: "Add Funds needed",
        message: `${formatCurrency(amount)} required · Cash Balance is ${formatCurrency(cashBalance)}. Bonus is for GA Robot drinks only.`,
        icon: "wallet-outline",
        actionLabel: "Add Funds",
        onAction: () => {
          setCashierPartnerOffer(null);
          setCashierPartnerBenefit(null);
          setCashierRecentCard(null);
          setCashierCardId("");
          setIsPartnerOffersOpen(false);
          setActivePartnerOfferId(null);
          setIsTopUpOpen(true);
        }
      });
      return null;
    }
    const createdAt = Date.now();
    const voucherCode = createPartnerVoucherCode(createdAt);
    setAppState((state) =>
      purchasePartnerOffer(state, offer, {
        methodId: cashierPayment,
        methodTitle: selectedMethod.title,
        amount,
        pointsRedeemed: cashierPartnerBenefit?.pointsRedeemed,
        benefitTitle: cashierPartnerBenefit?.benefitsApplied[0]?.title
      }, createdAt)
    );
    const isNoPaymentRequired = amount <= 0;
    return {
      title: isNoPaymentRequired ? "Purchase Confirmed" : "Payment Successful",
      message: isNoPaymentRequired
        ? `${cashierPartnerBenefit?.benefitsApplied[0]?.title ?? "Benefits"} applied · ${offer.purchaseCategory === "ticket" ? "Ticket" : "Voucher"} added`
        : `${formatCurrency(amount)} paid · ${offer.purchaseCategory === "ticket" ? "Ticket" : "Voucher"} added`,
      meta: cashierPartnerBenefit?.pointsRedeemed
        ? `-${cashierPartnerBenefit.pointsRedeemed.toLocaleString()} Points`
        : `${selectedMethod.title} confirmed`,
      details: isNoPaymentRequired ? createCashierConfirmationDetails("PAY", createdAt) : createCashierReceiptDetails("PAY", cashierPayment, createdAt),
      onComplete: () => {
        setCashierPartnerOffer(null);
        setCashierPartnerBenefit(null);
        setCashierRecentCard(null);
        setCashierCardId("");
        setIsPartnerOffersOpen(false);
        setActivePartnerOfferId(null);
        setActiveCouponAsset({ type: "partnerVoucher", id: voucherCode });
        setIsCouponListOpen(true);
      }
    };
  }

  function handleCashierPayment(): CashierPaymentOutcome | null {
    if (qaCashierFailureEnabled) {
      return {
        status: "error",
        title: "Payment Failed",
        message: "QA payment failure simulation is on. No order, wallet change, gift, add funds, or partner purchase was created.",
        meta: "Development Tools · QA mode",
        onComplete: () => undefined
      };
    }
    if (cashierTopUp) {
      return handleCashierTopUpPayment();
    }
    if (cashierGift) {
      return handleCashierGiftPayment();
    }
    if (cashierCheckout) {
      return handleCashierCheckoutPayment();
    }
    return handleCashierPartnerOfferPayment();
  }

  function handleSelectTheme(nextThemeId: AppThemeId) {
    setAppState((state) => setAppTheme(state, nextThemeId));
  }

  function handleSelectProductDisplayPreference(area: ProductDisplayArea, nextMode: ProductDisplayOverride) {
    setAppState((state) => setProductDisplayPreference(state, area, nextMode));
  }

  function handleSelectProductDisplayDefaultMode(nextMode: ProductDisplayMode) {
    setAppState((state) => setProductDisplayDefaultMode(state, nextMode));
  }

  function handleSetDefaultPaymentMethod(methodId: PaymentMethodId) {
    setAppState((state) => setDefaultPaymentMethod(state, methodId));
    setCheckoutPayment(methodId);
    setGiftPayment(methodId);
    setTopUpPayment(getEligibleDefaultPaymentMethod(methodId, "topup"));
  }

  function handleAddPaymentMethodFromSelection(methodId: PaymentMethodId, card?: SavedPaymentCard, makeDefault = false) {
    const isAddingFromCashier = Boolean(cashierPartnerOffer || cashierTopUp || cashierGift || cashierCheckout);
    if (methodId === "card" && card) {
      setSavedPaymentCards((cards) => [...cards, card]);
      if (isAddingFromCashier) {
        setCashierCardId(card.id);
        setCashierRecentCard(card);
      }
      if (makeDefault) {
        setCurrentPaymentCardId(card.id);
        handleSetDefaultPaymentMethod("card");
      }
    } else if (methodId !== "card") {
      if (isAddingFromCashier) {
        setCashierRecentCard(null);
      }
      if (makeDefault) {
        handleSetDefaultPaymentMethod(methodId);
      }
    }
    if (methodId === "card" || methodId === "paypal") {
      setAddedPaymentMethodIds((ids) => ids.includes(methodId) ? ids : [...ids, methodId]);
    }
  }

  function handleChangeAutoReloadSettings(settings: AutoReloadSettings) {
    setAppState((state) => setAutoReloadSettingsInState(state, settings));
  }

  function handleXpAction(action: XpAction, eventKey: string) {
    updateAppStateWithExpToast((state) => applyXpAction(state, action, eventKey));
  }

  function handleRedeemPoints(reward: { id: string; title: string; pointsCost: number; validDays?: number; rewardType: "Coupon" | "Voucher" }) {
    if (pointsBalance < reward.pointsCost) {
      showAppToast({
        tone: "warning",
        title: "Not Enough Points",
        message: `${reward.pointsCost.toLocaleString()} Points required · You have ${pointsBalance.toLocaleString()}.`,
        icon: "sparkles-outline"
      });
      return;
    }
    setAppState((state) => redeemPoints(state, reward));
    showAppToast({
      tone: "success",
      title: "Reward Redeemed",
      message: `${reward.title} was added to My Rewards.`,
      icon: reward.rewardType === "Coupon" ? "ticket-outline" : "gift-outline",
      actionLabel: "View",
      onAction: () => {
        setActiveTab("rewards");
        setActiveCouponAsset(null);
        setCouponInitialFilter(reward.rewardType === "Coupon" ? "Coupons" : "Vouchers");
        setIsCouponListOpen(true);
      }
    });
  }

  function resetNavigationSurfaces() {
    setActiveVMId(null);
    setActiveSkuId(null);
    setIsCartOpen(false);
    setIsCouponListOpen(false);
    setActiveCouponAsset(null);
    setCouponInitialFilter("All");
    setIsPartnerOffersOpen(false);
    setActivePartnerOfferId(null);
    setIsBenefitListOpen(false);
    setIsTopUpOpen(false);
    setIsTierOpen(false);
    setIsExpHistoryOpen(false);
    setIsMissionsOpen(false);
    setIsPointsOpen(false);
    setIsPartnerBenefitsOpen(false);
    setMeInitialPage(null);
    setActivityTab(null);
    setActivityReadyOnly(false);
    setActiveHomeOrderId(null);
    setActivePaymentMode(null);
    setActivePaymentInitialPage("list");
    setCashierPartnerOffer(null);
    setCashierPartnerBenefit(null);
    setCashierTopUp(null);
    setCashierGift(null);
    setCashierCheckout(null);
    setCashierRecentCard(null);
    setCashierCardId("");
    setCheckoutItems(null);
  }

  function handleResetDemoState() {
    const initialState = createInitialAppState();
    setAppState(initialState);
    setUserProfile(defaultProfile);
    setCheckoutPayment(initialState.defaultPaymentMethod);
    setGiftPayment(initialState.defaultPaymentMethod);
    setTopUpPayment(getEligibleDefaultPaymentMethod(initialState.defaultPaymentMethod, "topup"));
    setCashierPayment(initialState.defaultPaymentMethod);
    setAddedPaymentMethodIds(["wallet", "card"]);
    setSavedPaymentCards(createDefaultSavedPaymentCards());
    setCurrentPaymentCardId("visa-4242");
    setDismissedAttentionIds([]);
    setActiveHomeOrderReturnTarget("home");
    setActivePaymentPayable(0);
    setActivePaymentPoints(0);
    resetNavigationSurfaces();
    setActiveTab("home");
    showAppToast({
      tone: "success",
      title: "Demo state reset",
      message: "System seed data and default configuration are restored.",
      icon: "refresh-outline"
    });
  }

  function switchTab(tab: TabKey) {
    if (tab === activeTab) {
      const scrollKey = rootTabScrollKeys[tab];
      if (scrollKey) {
        clearSavedScrollPosition(scrollKey);
      }
      resetNavigationSurfaces();
      setRootTabResetVersions((versions) => ({
        ...versions,
        [tab]: versions[tab] + 1
      }));
      return;
    }
    setActiveTab(tab);
    resetNavigationSurfaces();
  }

  activateAppTheme(themeId);
  const expTierVisual = getTierVisual(getTierByExp(xpBalance));
  const expToastTranslateY = expToastAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0]
  });
  const expToastScale = expToastAnimation.interpolate({
    inputRange: [0, 0.58, 1],
    outputRange: [0.72, 1.08, 1]
  });
  const expToastIconScale = expToastAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.62, 1.24, 1]
  });
  const isCashierOpen = Boolean(cashierPartnerOffer || cashierTopUp || cashierGift || cashierCheckout);
  const isPaymentFlowOpen = isCashierOpen || Boolean(activePaymentMode);
  const cashierMode: PaymentMethodMode = cashierTopUp ? "topup" : cashierGift ? "gift" : "checkout";
  const cashierAmount = cashierPartnerOffer
    ? cashierPartnerBenefit?.payableAmount ?? parseCurrency(cashierPartnerOffer.price ?? "$0")
    : cashierTopUp?.amount ?? cashierGift?.request.payableAmount ?? cashierGift?.request.amount ?? cashierCheckout?.request.amount ?? 0;
  const cashierWalletBalance = cashierPartnerOffer ? cashBalance : walletBalance;
  const cashierWalletBalanceLabel = cashierPartnerOffer ? "Cash Balance" : "Available Balance";
  const cashierPaymentNoticeText = cashierPartnerOffer
    ? "Partner offers are paid with Cash Balance or other payment methods. Bonus is for GA Robot drinks only."
    : undefined;
  const cashierLowBalanceNoticeText = cashierPartnerOffer
    ? "Add funds or choose another payment method. Bonus cannot be used for partner offers."
    : undefined;
  const cashierBenefitsApplied = cashierCheckout?.request.benefitsApplied ?? cashierGift?.request.benefitsApplied ?? cashierPartnerBenefit?.benefitsApplied ?? [];
  const cashierTitle = cashierPartnerOffer
    ? cashierPartnerOffer.purchaseCategory === "ticket"
      ? "Partner ticket"
      : "Partner voucher"
    : cashierGift
    ? "Gift payment"
    : cashierCheckout
    ? "Prepaid order"
    : "Add Funds";
  const cashierEyebrow = cashierTopUp ? "Wallet cashier" : cashierGift ? "Gift cashier" : cashierCheckout ? "Order cashier" : "Secure cashier";
  const cashierSummaryTitle = cashierPartnerOffer
    ? cashierPartnerOffer.title
    : cashierTopUp
    ? `${formatCurrency(cashierTopUp.amount)} Cash`
    : cashierGift
    ? cashierGift.request.title
    : cashierCheckout
    ? cashierCheckout.request.title
    : "";
  const cashierSummaryText = cashierPartnerOffer
    ? cashierPartnerOffer.partnerName
    : cashierTopUp
    ? `${formatCurrency(cashierTopUp.rewardsBonus)} Bonus will be added`
    : cashierGift
    ? `To ${cashierGift.request.recipientName}`
    : cashierCheckout
    ? `${cashierCheckout.request.itemCount} items prepaid`
    : "";
  const cashierMethods = cashierAvailablePaymentMethods.filter(
    (method) => method.modes.includes(cashierMode) && method.id !== "paypal"
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View key={`${activeTab}-${rootTabResetVersions[activeTab]}`} style={styles.appShell}>
          {renderScreen(
            activeTab,
            setActiveTab,
            activeVMId,
            setActiveVMId,
            activeSkuId,
            setActiveSkuId,
            isCartOpen,
            setIsCartOpen,
            isCouponListOpen,
            setIsCouponListOpen,
            activeCouponAsset,
            setActiveCouponAsset,
            couponInitialFilter,
            setCouponInitialFilter,
            isPartnerOffersOpen,
            setIsPartnerOffersOpen,
            activePartnerOfferId,
            setActivePartnerOfferId,
            setCashierPartnerOffer,
            setCashierRecentCard,
            setCashierCardId,
            setCashierTopUp,
            setCashierGift,
            setCashierCheckout,
            setCashierPayment,
            isBenefitListOpen,
            setIsBenefitListOpen,
            isTopUpOpen,
            setIsTopUpOpen,
            isTierOpen,
            setIsTierOpen,
            isExpHistoryOpen,
            setIsExpHistoryOpen,
            isMissionsOpen,
            setIsMissionsOpen,
            isPointsOpen,
            setIsPointsOpen,
            isPartnerBenefitsOpen,
            setIsPartnerBenefitsOpen,
            isAttentionOpen,
            setIsAttentionOpen,
            isGiftHistoryOpen,
            setIsGiftHistoryOpen,
            dismissedAttentionIds,
            handleDismissAttention,
            activityTab,
            setActivityTab,
            activityReadyOnly,
            setActivityReadyOnly,
            activeHomeOrderId,
            setActiveHomeOrderId,
            activeHomeOrderReturnTarget,
            setActiveHomeOrderReturnTarget,
            activePaymentMode,
            setActivePaymentMode,
            setActivePaymentInitialPage,
            activePaymentPayable,
            setActivePaymentPayable,
            activePaymentPoints,
            setActivePaymentPoints,
            userProfile,
            meInitialPage,
            setMeInitialPage,
            setUserProfile,
            checkoutItems,
            setCheckoutItems,
            checkoutBenefitAsset,
            setCheckoutBenefitAsset,
            checkoutPayment,
            setCheckoutPayment,
            topUpPayment,
            setTopUpPayment,
            giftPayment,
            setGiftPayment,
            cashBalance,
            walletBalance,
            walletBalances,
            bonusSummary,
            autoReloadSettings,
            handleChangeAutoReloadSettings,
            pointsBalance,
            xpBalance,
            xpHistory,
            checkInStreak,
            lastCheckInDate,
            handleXpAction,
            handleRedeemPoints,
            handleTopUp,
            sentGifts,
            friends,
            handleGiftPurchase,
            orders,
            paymentHistory,
            walletHistory,
            claimedCouponIds,
            purchasedPartnerOffers,
            redeemedPointRewards,
            usedBenefitIds,
            usedBenefitRecords,
            handleClaimCoupon,
            handlePurchasePartnerOffer,
            handleCheckoutSuccess,
            cartCount,
            cartItems,
            favoriteSkuIds,
            toggleFavoriteSku,
            addToCart,
            removeCartItem,
            meScrollYRef.current,
            (offsetY) => {
              meScrollYRef.current = offsetY;
            },
            () => {
              resetNavigationSurfaces();
              setActiveTab("me");
              setActivityReadyOnly(true);
              setActivityTab("Orders");
            },
            () => {
              handleXpAction("nearby-deals", `nearby-deals:${getLocalDateKey()}`);
              switchTab("map");
            },
            () => {
              switchTab("category");
            },
            themeId,
            handleSelectTheme,
            productDisplayPreferences,
            handleSelectProductDisplayDefaultMode,
            handleSelectProductDisplayPreference,
            defaultPaymentMethod,
            handleSetDefaultPaymentMethod,
            addedPaymentMethodIds,
            setAddedPaymentMethodIds,
            savedPaymentCards,
            setSavedPaymentCards,
            currentPaymentCardId,
            setCurrentPaymentCardId,
            systemPaymentMethodIds,
            showAppToast,
            qaCashierFailureEnabled,
            setQaCashierFailureEnabled,
            pointsInstantRedeemEnabled,
            setPointsInstantRedeemEnabled,
            handleResetDemoState
          )}
        </View>
      </View>
      {isCashierOpen ? (
        <View style={styles.paymentSelectionOverlay}>
          <CashierScreen
            title={cashierTitle}
            eyebrow={cashierEyebrow}
            amount={cashierAmount}
            summaryTitle={cashierSummaryTitle}
            summaryText={cashierSummaryText}
            benefitsApplied={cashierBenefitsApplied}
            selectedPayment={cashierPayment}
            availableMethods={cashierMethods}
            savedCards={cashierSavedCards}
            selectedCardId={cashierCardId}
            walletBalance={cashierWalletBalance}
            walletBalanceLabel={cashierWalletBalanceLabel}
            paymentNoticeText={cashierPaymentNoticeText}
            lowBalanceNoticeText={cashierLowBalanceNoticeText}
            onBack={() => {
              if (cashierGift) {
                cashierGift.onCancel();
              }
              setCashierPartnerOffer(null);
              setCashierPartnerBenefit(null);
              setCashierTopUp(null);
              setCashierGift(null);
              setCashierCheckout(null);
              setCashierRecentCard(null);
              setCashierCardId("");
            }}
            onOpenPaymentMethod={() => {
              setActivePaymentPayable(cashierAmount);
              setActivePaymentPoints(0);
              setActivePaymentInitialPage("add-method");
              setActivePaymentMode(cashierMode);
            }}
            onSelectPayment={setCashierPayment}
            onSelectCard={(cardId) => {
              setCashierCardId(cardId);
              setCashierPayment("card");
            }}
            onAddFunds={() => {
              if (cashierGift) {
                cashierGift.onCancel();
              }
              setCashierPartnerOffer(null);
              setCashierPartnerBenefit(null);
              setCashierTopUp(null);
              setCashierGift(null);
              setCashierCheckout(null);
              setCashierRecentCard(null);
              setCashierCardId("");
              setIsPartnerOffersOpen(false);
              setActivePartnerOfferId(null);
              setActiveTab("home");
              setIsTopUpOpen(true);
            }}
            onPay={handleCashierPayment}
          />
        </View>
      ) : null}
      {activePaymentMode ? (
        <View style={styles.paymentSelectionOverlay}>
          <PaymentMethodSelectionScreen
            mode={activePaymentMode}
            selectedPayment={
              cashierPartnerOffer || cashierTopUp || cashierGift || cashierCheckout
                ? cashierPayment
                : activePaymentMode === "checkout"
                  ? checkoutPayment
                  : activePaymentMode === "gift"
                  ? giftPayment
                  : topUpPayment
            }
            walletBalance={cashierPartnerOffer ? cashBalance : walletBalance}
            availableMethods={availablePaymentMethods}
            initialPage={activePaymentInitialPage}
            payable={activePaymentPayable}
            onBack={() => {
              setActivePaymentInitialPage("list");
              setActivePaymentMode(null);
            }}
            onAddPaymentMethod={handleAddPaymentMethodFromSelection}
            onSelect={(methodId) => {
              if (cashierPartnerOffer || cashierTopUp || cashierGift || cashierCheckout) {
                setCashierPayment(methodId);
              } else if (activePaymentMode === "checkout") {
                setCheckoutPayment(methodId);
              } else if (activePaymentMode === "gift") {
                setGiftPayment(methodId);
              } else {
                setTopUpPayment(methodId);
              }
              setActivePaymentInitialPage("list");
              setActivePaymentMode(null);
            }}
          />
        </View>
      ) : null}
      {expToast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.expToast,
            appToast && styles.expToastStacked,
            {
              backgroundColor: expTierVisual.background,
              borderColor: expTierVisual.border,
              opacity: expToastAnimation,
              transform: [{ translateY: expToastTranslateY }, { scale: expToastScale }]
            }
          ]}
        >
          <Animated.View
            style={[
              styles.expToastIcon,
              {
                backgroundColor: expTierVisual.tileBackground,
                transform: [{ scale: expToastIconScale }]
              }
            ]}
          >
            <Ionicons name="sparkles" size={20} color={expTierVisual.accent} />
          </Animated.View>
          <View style={styles.expToastCopy}>
            <Text style={[styles.expToastTitle, { color: expTierVisual.primaryText }]}>+{expDisplayAmount}</Text>
            <Text style={[styles.expToastText, { color: expTierVisual.mutedText }]}>EXP</Text>
          </View>
        </Animated.View>
      ) : null}
      {appToast ? (
        <View
          style={[
            styles.appToast,
            getAppToastStyle(appToast.tone)
          ]}
        >
          <View style={[styles.appToastAccent, getAppToastAccentStyle(appToast.tone)]} />
          <View style={[styles.appToastIcon, getAppToastIconStyle(appToast.tone)]}>
            <Ionicons name={appToast.icon ?? getAppToastIcon(appToast.tone)} size={18} color={getAppToastIconColor(appToast.tone)} />
          </View>
          <View style={styles.appToastCopy}>
            <Text style={styles.appToastTitle}>{appToast.title}</Text>
            {appToast.message ? (
              <Text style={styles.appToastText} numberOfLines={2}>
                {appToast.message}
              </Text>
            ) : null}
          </View>
          {appToast.actionLabel && appToast.onAction ? (
            <TouchableOpacity
              style={styles.appToastAction}
              activeOpacity={0.84}
              onPress={() => {
                const action = appToast.onAction;
                dismissAppToast();
                action?.();
              }}
            >
              <Text style={styles.appToastActionText}>{appToast.actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.appToastClose}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Close notification"
            onPress={dismissAppToast}
          >
            <Ionicons name="close" size={17} color="#F2EDE4" />
          </TouchableOpacity>
        </View>
      ) : null}
      {!isPaymentFlowOpen ? <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.tabItem,
                tab.key === "scan" && styles.scanTabItem
              ]}
              onPress={() => switchTab(tab.key)}
            >
              {tab.key === "scan" ? (
                <View style={styles.scanIconShell}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : "qr-code-outline"}
                    size={41}
                    color={isActive ? colors.blue : colors.success}
                  />
                </View>
              ) : (
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={26}
                  color={isActive ? colors.blue : colors.muted}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  tab.key === "scan" && styles.scanTabLabel,
                  isActive && styles.tabLabelActive,
                  { color: isActive ? colors.blue : colors.muted }
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View> : null}
    </SafeAreaView>
  );
}

function getLocalDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getExpToastScene(type: XpRecord["type"]) {
  switch (type) {
    case "Purchase":
      return "Order progress";
    case "Wallet":
      return "Wallet contribution";
    case "Gift":
      return "Gift sent";
    case "Referral":
      return "Friend milestone";
    default:
      return "Member activity";
  }
}

function getAppToastIcon(tone: AppToastTone): keyof typeof Ionicons.glyphMap {
  switch (tone) {
    case "success":
      return "checkmark-circle-outline";
    case "warning":
      return "alert-circle-outline";
    case "error":
      return "close-circle-outline";
    default:
      return "information-circle-outline";
  }
}

function getAppToastIconColor(tone: AppToastTone) {
  return tone === "success" ? colors.success : tone === "warning" ? colors.warning : tone === "error" ? colors.berry : colors.blue;
}

function getAppToastStyle(tone: AppToastTone) {
  return {
    borderColor:
      tone === "success"
        ? colors.success
        : tone === "warning"
          ? colors.warning
          : tone === "error"
            ? colors.berry
            : colors.blue
  };
}

function getAppToastAccentStyle(tone: AppToastTone) {
  return {
    backgroundColor:
      tone === "success"
        ? colors.success
        : tone === "warning"
          ? colors.warning
          : tone === "error"
            ? colors.berry
            : colors.blue
  };
}

function getAppToastIconStyle(tone: AppToastTone) {
  return {
    backgroundColor:
      tone === "success"
        ? statusColors.success.background
        : tone === "warning"
          ? statusColors.warning.background
          : tone === "error"
            ? statusColors.danger.background
            : colors.tint
  };
}

function parseCurrency(value: string) {
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function createCashierReceiptDetails(prefix: string, methodId: PaymentMethodId, timestamp: number) {
  return [
    { label: "Paid At", value: formatReceiptDateTime(timestamp) },
    { label: "Payment ID", value: createDisplayBusinessId(prefix, timestamp) },
    { label: "Transaction ID", value: createPaymentTransactionId(methodId, timestamp) }
  ];
}

function createCashierConfirmationDetails(prefix: string, timestamp: number) {
  return [
    { label: "Confirmed At", value: formatReceiptDateTime(timestamp) },
    { label: "Reference ID", value: createDisplayBusinessId(prefix, timestamp) }
  ];
}

function createDisplayBusinessId(prefix: string, timestamp: number) {
  return `${prefix}-${formatBusinessDate(timestamp)}-${formatBusinessSequence(timestamp)}`;
}

function createPaymentTransactionId(methodId: PaymentMethodId, timestamp: number) {
  const channel =
    methodId === "wallet"
      ? "WAL"
      : methodId === "card"
        ? "CRD"
        : methodId === "apple-pay"
          ? "APL"
          : methodId === "google-pay"
            ? "GGL"
            : "PPL";
  return `TXN-${channel}-${formatBusinessDate(timestamp)}-${formatBusinessSequence(timestamp + 37)}`;
}

function formatBusinessDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function formatBusinessSequence(seed: number) {
  return String(seed).replace(/\D/g, "").slice(-6).padStart(6, "0");
}

function formatReceiptDateTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  appShell: {
    flex: 1
  },
  paymentSelectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 52,
    backgroundColor: colors.canvas
  },
  expToast: {
    position: "absolute",
    right: 24,
    bottom: controlSizes.bottomActionBar + 72,
    width: 92,
    height: 92,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 46,
    borderWidth: 1,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 23
  },
  expToastStacked: {
    bottom: controlSizes.bottomActionBar + 104
  },
  appToast: {
    position: "absolute",
    bottom: controlSizes.bottomActionBar + 34,
    left: 22,
    right: 22,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(48, 45, 42, 0.92)",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 14,
    zIndex: 22
  },
  appToastAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16
  },
  appToastIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18
  },
  appToastCopy: {
    flex: 1,
    minWidth: 0
  },
  appToastTitle: {
    color: colors.onDark,
    fontSize: 15,
    fontWeight: "800"
  },
  appToastText: {
    color: "#D7CEBD",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 2
  },
  appToastAction: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  appToastActionText: {
    color: "#F5D38E",
    fontSize: 12,
    fontWeight: "900"
  },
  appToastClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)"
  },
  expToastIcon: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    marginBottom: 1
  },
  expToastCopy: {
    alignItems: "center"
  },
  expToastTitle: {
    color: colors.onDark,
    fontSize: 24,
    fontWeight: "900"
  },
  expToastText: {
    color: "#D7CEBD",
    fontSize: 11,
    fontWeight: "900",
    marginTop: -2
  },
  tabBar: {
    minHeight: controlSizes.bottomActionBar - spacing.xxs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingBottom: spacing.sm - spacing.xxs,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface
  },
  tabItem: {
    minWidth: 58,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs - 1,
    borderRadius: radii.md,
    position: "relative"
  },
  scanTabItem: {
    minWidth: 76
  },
  scanIconShell: {
    width: 54,
    height: 44,
    marginTop: -8,
    alignItems: "center",
    justifyContent: "center"
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: typography.body.fontWeight
  },
  scanTabLabel: {
    fontSize: 12,
    fontWeight: typography.label.fontWeight
  },
  tabLabelActive: {
    fontWeight: "800"
  }
});
