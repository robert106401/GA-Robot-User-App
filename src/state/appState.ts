import type {
  CartItem,
  CheckoutResult,
  GiftPurchaseResult,
  GiftRecord,
  FriendRecord,
  OrderRecord,
  PartnerOfferPurchaseRecord,
  PaymentHistoryRecord,
  RedeemedPointReward,
  TopUpResult,
  UsedBenefitRecord,
  WalletHistoryRecord,
  XpRecord
} from "../types";
import type { PaymentMethodId } from "../paymentMethods";
import type { AutoReloadSettings } from "../autoReload.ts";
import {
  calculateAddFundsXp,
  calculatePurchaseXp,
  XP_RULES
} from "../xp.ts";
import type { XpAction } from "../xp.ts";
import {
  autoReloadAmounts,
  autoReloadThresholds,
  defaultAutoReloadSettings
} from "../autoReload.ts";

export const PREPAID_COLLECTION_WINDOW_MS = (24 * 60 - 1) * 60 * 1000;
const POINT_REWARD_VALID_DAYS = 7;

export type AppThemeId = "classic" | "vibrant" | "urbanPulse" | "cupertino" | "vividNature";
export type ProductDisplayMode = "row" | "card";
export type ProductDisplayOverride = "default" | ProductDisplayMode;
export type ProductDisplayPreferences = {
  defaultMode: ProductDisplayMode;
  homeBestSellers: ProductDisplayOverride;
  orderAllMenu: ProductDisplayOverride;
  homePartnerOffers: ProductDisplayOverride;
  allPartnerOffers: ProductDisplayOverride;
};
export type ProductDisplayArea = Exclude<keyof ProductDisplayPreferences, "defaultMode">;

export const defaultProductDisplayPreferences: ProductDisplayPreferences = {
  defaultMode: "row",
  homeBestSellers: "default",
  orderAllMenu: "default",
  homePartnerOffers: "default",
  allPartnerOffers: "default"
};

export type PersistedAppState = {
  version: 13;
  themeId: AppThemeId;
  productDisplayPreferences: ProductDisplayPreferences;
  defaultPaymentMethod: PaymentMethodId;
  autoReloadSettings: AutoReloadSettings;
  cashBalance: number;
  rewardsBonusBalance: number;
  pointsBalance: number;
  xpBalance: number;
  xpHistory: XpRecord[];
  xpAwardKeys: string[];
  checkInStreak: number;
  lastCheckInDate: string | null;
  orders: OrderRecord[];
  paymentHistory: PaymentHistoryRecord[];
  walletHistory: WalletHistoryRecord[];
  cartItems: Record<string, CartItem>;
  favoriteSkuIds: string[];
  claimedCouponIds: string[];
  purchasedPartnerOffers: PartnerOfferPurchaseRecord[];
  redeemedPointRewards: RedeemedPointReward[];
  usedBenefitIds: string[];
  usedBenefitRecords: UsedBenefitRecord[];
  sentGifts: GiftRecord[];
  friends: FriendRecord[];
};

export const APP_STATE_VERSION = 13;
const PREVIOUS_APP_STATE_VERSION = 12;
const DEMO_EXPIRED_ORDER_ID = "order-demo-expired-prepaid";
const DEMO_WALLET_EXCEPTION_ID = "wallet-demo-expired-credit";
const INITIAL_USED_BENEFIT_RECORDS: UsedBenefitRecord[] = [
  { key: "Voucher:voucher-used-duo", usedAt: "2026-06-09 08:42" },
  { key: "Coupon:coupon-6", usedAt: "2026-06-18 15:26" }
];

const demoExpiredOrder: OrderRecord = {
  id: DEMO_EXPIRED_ORDER_ID,
  orderNumber: "ORD-260621-000042",
  title: "Classic Bubble Tea",
  date: "2026-06-20 17:45",
  amount: "$5.20",
  orderMode: "app_preorder",
  status: "Expired",
  itemCount: 1,
  paymentMethod: "Wallet eCard",
  points: 57,
  items: [
    {
      skuId: "sku-3",
      name: "Classic Bubble Tea",
      quantity: 1,
      customizationSummary: "Iced · Regular Sugar · Regular Ice"
    }
  ],
  pickupExpiresAt: "Expired Jun 21 at 5:45 PM",
  pickupExpiresAtEpoch: 1782089100000,
  redemptionMethod: "vm_code"
};

const demoWalletExceptionRecord: WalletHistoryRecord = {
  id: DEMO_WALLET_EXCEPTION_ID,
  transactionId: "EXP-ORD-260621-000042",
  title: "Expired order credit",
  description: "ORD-260621-000042 · Moved to Bonus",
  date: "2026-06-21 17:45",
  amount: 5.2,
  balanceAfter: 54,
  type: "Rewards Bonus",
  account: "Rewards Bonus",
  relatedOrderNumber: "ORD-260621-000042",
  originalPaymentMethod: "Wallet eCard",
  originalPaidAmount: 5.2,
  originalPaidAt: "2026-06-20 17:45",
  expiredAt: "2026-06-21 17:45",
  creditedTo: "Bonus Balance"
};

export function createInitialAppState(): PersistedAppState {
  return {
    version: APP_STATE_VERSION,
    themeId: "cupertino",
    productDisplayPreferences: defaultProductDisplayPreferences,
    defaultPaymentMethod: "wallet",
    autoReloadSettings: defaultAutoReloadSettings,
    cashBalance: 20,
    rewardsBonusBalance: 4.5,
    pointsBalance: 8000,
    xpBalance: 4800,
    xpHistory: [],
    xpAwardKeys: [],
    checkInStreak: 0,
    lastCheckInDate: null,
    orders: [demoExpiredOrder],
    paymentHistory: [],
    walletHistory: [demoWalletExceptionRecord],
    cartItems: {},
    favoriteSkuIds: [],
    claimedCouponIds: ["coupon-3", "coupon-6"],
    purchasedPartnerOffers: [],
    redeemedPointRewards: [],
    usedBenefitIds: INITIAL_USED_BENEFIT_RECORDS.map((record) => record.key),
    usedBenefitRecords: INITIAL_USED_BENEFIT_RECORDS,
    sentGifts: [],
    friends: [
      { id: "friend-jamie", name: "Jamie", phone: "+1 604 555 0123", gender: "Female", relationship: "Friend", note: "Birthday coffee" },
      { id: "friend-maya", name: "Maya", phone: "+1 604 555 0124", gender: "Female", relationship: "Classmate", note: "Milk tea fan" }
    ]
  };
}

export function normalizePersistedAppState(value: unknown): PersistedAppState {
  const fallback = createInitialAppState();
  const isPreviousVersion = isRecord(value) && value.version === PREVIOUS_APP_STATE_VERSION;
  if (
    !isRecord(value) ||
    (value.version !== APP_STATE_VERSION && !isPreviousVersion)
  ) {
    return fallback;
  }

  const xpHistory = Array.isArray(value.xpHistory)
    ? (value.xpHistory as XpRecord[]).map(normalizeXpRecord)
    : fallback.xpHistory;
  const xpAwardKeys = Array.isArray(value.xpAwardKeys)
    ? value.xpAwardKeys
      .filter((key): key is string => typeof key === "string")
      .map((key) => normalizeXpAwardKey(key, xpHistory))
    : fallback.xpAwardKeys;

  return {
    version: APP_STATE_VERSION,
    themeId: normalizeThemeId(value.themeId, fallback.themeId),
    productDisplayPreferences: normalizeProductDisplayPreferences(value, fallback.productDisplayPreferences),
    defaultPaymentMethod: normalizePaymentMethodId(
      value.defaultPaymentMethod,
      fallback.defaultPaymentMethod
    ),
    autoReloadSettings: normalizeAutoReloadSettings(value.autoReloadSettings, fallback.autoReloadSettings),
    cashBalance: finiteNumber(value.cashBalance, fallback.cashBalance),
    rewardsBonusBalance: finiteNumber(value.rewardsBonusBalance, fallback.rewardsBonusBalance),
    pointsBalance: finiteNumber(value.pointsBalance, fallback.pointsBalance),
    xpBalance: isPreviousVersion ? fallback.xpBalance : finiteNumber(value.xpBalance, fallback.xpBalance),
    xpHistory,
    xpAwardKeys,
    checkInStreak: finiteNumber(value.checkInStreak, fallback.checkInStreak),
    lastCheckInDate:
      typeof value.lastCheckInDate === "string" ? value.lastCheckInDate : null,
    orders: Array.isArray(value.orders) ? ensureDemoExpiredOrder((value.orders as OrderRecord[]).map(normalizeOrderRecord)) : fallback.orders,
    paymentHistory: Array.isArray(value.paymentHistory)
      ? (value.paymentHistory as PaymentHistoryRecord[]).map(normalizePaymentHistoryRecord)
      : fallback.paymentHistory,
    walletHistory: Array.isArray(value.walletHistory)
      ? ensureDemoWalletException((value.walletHistory as WalletHistoryRecord[]).map(normalizeWalletHistoryRecord))
      : fallback.walletHistory,
    cartItems: isRecord(value.cartItems) ? (value.cartItems as Record<string, CartItem>) : fallback.cartItems,
    favoriteSkuIds: Array.isArray(value.favoriteSkuIds)
      ? value.favoriteSkuIds.filter((id): id is string => typeof id === "string")
      : fallback.favoriteSkuIds,
    claimedCouponIds: Array.isArray(value.claimedCouponIds)
      ? value.claimedCouponIds.filter((id): id is string => typeof id === "string")
      : fallback.claimedCouponIds,
    purchasedPartnerOffers: Array.isArray(value.purchasedPartnerOffers)
      ? (value.purchasedPartnerOffers as PartnerOfferPurchaseRecord[]).filter(isPartnerOfferPurchaseRecord)
      : fallback.purchasedPartnerOffers,
    redeemedPointRewards: Array.isArray(value.redeemedPointRewards)
      ? (value.redeemedPointRewards as RedeemedPointReward[]).filter(isRedeemedPointReward)
      : fallback.redeemedPointRewards,
    usedBenefitIds: Array.isArray(value.usedBenefitIds)
      ? value.usedBenefitIds.filter((id): id is string => typeof id === "string")
      : fallback.usedBenefitIds,
    usedBenefitRecords: Array.isArray(value.usedBenefitRecords)
      ? (value.usedBenefitRecords as UsedBenefitRecord[]).filter(isUsedBenefitRecord)
      : createLegacyUsedBenefitRecords(value.usedBenefitIds, fallback.usedBenefitRecords),
    sentGifts: Array.isArray(value.sentGifts) ? (value.sentGifts as GiftRecord[]).map(normalizeGiftRecord) : fallback.sentGifts,
    friends: Array.isArray(value.friends) ? (value.friends as FriendRecord[]) : fallback.friends
  };
}

function normalizeAddFundsReference(value: string) {
  return normalizeAddFundsReferenceForDate(value);
}

function normalizeAddFundsReferenceForDate(value: string, date?: string) {
  return value
    .replace(/topup:TU(\d+)/g, (_, digits: string) => `add-funds:${createBusinessIdFromDate("AF", date, digits)}`)
    .replace(/add-funds:AF(\d+)/g, (_, digits: string) => `add-funds:${createBusinessIdFromDate("AF", date, digits)}`)
    .replace(/send-gift:GIFT(\d+)/g, (_, digits: string) => `send-gift:${createBusinessIdFromDate("GFT", date, digits)}`)
    .replace(/send-gift:GFT(\d+)/g, (_, digits: string) => `send-gift:${createBusinessIdFromDate("GFT", date, digits)}`)
    .replace(/\bTU(\d+)/g, (_, digits: string) => createBusinessIdFromDate("AF", date, digits))
    .replace(/\bAF(\d+)/g, (_, digits: string) => createBusinessIdFromDate("AF", date, digits))
    .replace(/\bPAY(\d+)/g, (_, digits: string) => createBusinessIdFromDate("PAY", date, digits))
    .replace(/\bGIFT(\d+)/g, (_, digits: string) => createBusinessIdFromDate("GFT", date, digits))
    .replace(/\bGFT(\d+)/g, (_, digits: string) => createBusinessIdFromDate("GFT", date, digits))
    .replace(/\bGA-(\d{4}-\d{4})\b/g, "GV-$1");
}

function normalizeTransactionId(transactionId: string | undefined, date?: string) {
  if (!transactionId || /^[A-Z]+-\d{6}-\d{6}$/.test(transactionId)) {
    return transactionId;
  }
  const legacyMatch = transactionId.match(/^(TU|AF|PAY|GIFT|GFT)(\d+)$/);
  if (!legacyMatch) {
    return transactionId;
  }
  const prefix = legacyMatch[1] === "TU" ? "AF" : legacyMatch[1] === "GIFT" ? "GFT" : legacyMatch[1];
  return createBusinessIdFromDate(prefix, date, legacyMatch[2]);
}

function normalizeXpRecord(record: XpRecord): XpRecord {
  const eventKey = normalizeAddFundsReferenceForDate(record.eventKey, record.date);
  return eventKey === record.eventKey ? record : { ...record, eventKey };
}

function normalizeXpAwardKey(key: string, xpHistory: XpRecord[]) {
  const normalized = normalizeAddFundsReference(key);
  const sequence = normalized.match(/-(\d{6})$/)?.[1];
  const prefix = normalized.split(":")[0];
  const matchedRecord = sequence
    ? xpHistory.find((record) => record.eventKey.startsWith(`${prefix}:`) && record.eventKey.endsWith(`-${sequence}`))
    : undefined;
  return matchedRecord?.eventKey ?? normalized;
}

function isPartnerOfferPurchaseRecord(value: PartnerOfferPurchaseRecord): value is PartnerOfferPurchaseRecord {
  return isRecord(value) &&
    typeof value.offerId === "string" &&
    typeof value.code === "string" &&
    typeof value.purchasedAt === "string";
}

function isRedeemedPointReward(value: RedeemedPointReward): value is RedeemedPointReward {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    (value.rewardType === "Coupon" || value.rewardType === "Voucher") &&
    typeof value.pointsCost === "number" &&
    (value.status === "Active" || value.status === "Used" || value.status === "Expired") &&
    typeof value.date === "string" &&
    typeof value.expiresAt === "string";
}

function isUsedBenefitRecord(value: UsedBenefitRecord): value is UsedBenefitRecord {
  return isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.usedAt === "string";
}

function createLegacyUsedBenefitRecords(value: unknown, fallback: UsedBenefitRecord[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value
    .filter((key): key is string => typeof key === "string")
    .map((key) => ({
      key,
      usedAt: INITIAL_USED_BENEFIT_RECORDS.find((record) => record.key === key)?.usedAt ?? "2026-06-21 09:00"
    }));
}

function normalizePaymentHistoryRecord(record: PaymentHistoryRecord): PaymentHistoryRecord {
  const transactionId = normalizeTransactionId(record.transactionId, record.date);
  let description = record.description;
  const legacyAddFundsMatch = description.match(/^Paid (\$[\d.]+) · Rewards Bonus \+(\$[\d.]+)/);
  if (legacyAddFundsMatch) {
    description = `Cash +${legacyAddFundsMatch[1]} · Bonus +${legacyAddFundsMatch[2]}`;
  }
  description = description.replace(/^Pickup Order\b/, "Prepaid Order");
  description = normalizeOrderNumberReferences(description, record.date);
  description = description.replace(/\bOrder #(?=ORD-\d{6}-\d{6})/g, "");
  const legacyPrepaidOrderMatch = description.match(/^(Prepaid Order · (?:Order #)?[^ ·]+)/);
  if (legacyPrepaidOrderMatch) {
    description = legacyPrepaidOrderMatch[1];
  }
  if (record.transactionId) {
    const duplicateSuffix = ` · ${record.transactionId}`;
    if (description.endsWith(duplicateSuffix)) {
      description = description.slice(0, -duplicateSuffix.length);
    }
  }
  description = normalizeAddFundsReferenceForDate(description, record.date);
  return description === record.description && transactionId === record.transactionId
    ? record
    : { ...record, transactionId, description };
}

function normalizeWalletHistoryRecord(record: WalletHistoryRecord): WalletHistoryRecord {
  const transactionId = normalizeTransactionId(record.transactionId, record.date);
  const description = normalizeOrderNumberReferences(normalizeAddFundsReferenceForDate(record.description, record.date), record.date);
  const normalizedRecord = { ...record, transactionId, description };
  if (record.id === DEMO_WALLET_EXCEPTION_ID || (record.type === "Rewards Bonus" && record.title.toLowerCase().includes("expired"))) {
    const relatedOrderNumber = record.relatedOrderNumber ?? getExpiredWalletOrderNumber(normalizedRecord);
    return {
      ...normalizedRecord,
      relatedOrderNumber,
      originalPaymentMethod: record.originalPaymentMethod ?? "Wallet eCard",
      originalPaidAmount: record.originalPaidAmount ?? Math.abs(record.amount),
      originalPaidAt: record.originalPaidAt ?? inferPreviousDayTime(record.date),
      expiredAt: record.expiredAt ?? record.date,
      creditedTo: record.creditedTo ?? "Bonus Balance"
    };
  }
  return description === record.description && transactionId === record.transactionId
    ? record
    : normalizedRecord;
}

function getExpiredWalletOrderNumber(record: WalletHistoryRecord) {
  const fromDescription = record.description.split(" · ")[0];
  if (fromDescription.startsWith("ORD-")) {
    return fromDescription;
  }
  if (record.transactionId?.startsWith("EXP-ORD-")) {
    return record.transactionId.replace("EXP-", "");
  }
  return undefined;
}

function inferPreviousDayTime(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  parsed.setDate(parsed.getDate() - 1);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function ensureDemoWalletException(records: WalletHistoryRecord[]) {
  if (records.some((record) => record.id === DEMO_WALLET_EXCEPTION_ID)) {
    return records;
  }
  return [demoWalletExceptionRecord, ...records];
}

function ensureDemoExpiredOrder(records: OrderRecord[]) {
  if (records.some((record) => record.id === DEMO_EXPIRED_ORDER_ID)) {
    return records;
  }
  return [demoExpiredOrder, ...records];
}

function normalizeOrderRecord(record: OrderRecord): OrderRecord {
  const orderNumber = normalizeOrderNumber(record.orderNumber, record.date);
  return orderNumber === record.orderNumber
    ? record
    : {
        ...record,
        orderNumber,
        redemptionToken: record.redemptionToken
          ? `redeem-${orderNumber.toLowerCase()}-${record.redemptionToken.split("-").at(-1) ?? ""}`
          : record.redemptionToken
      };
}

function normalizeGiftRecord(record: GiftRecord): GiftRecord {
  const giftCode = normalizeGiftCode(record.giftCode, record.kind);
  const expiresAt = normalizeGiftExpiresAt(record.expiresAt, record.date);
  const claimedAt = record.status === "Claimed" ? record.claimedAt ?? record.date : record.claimedAt;
  return giftCode === record.giftCode && expiresAt === record.expiresAt && claimedAt === record.claimedAt
    ? record
    : { ...record, giftCode, expiresAt, claimedAt };
}

function normalizeGiftCode(giftCode: string, kind: GiftRecord["kind"]) {
  if (giftCode.startsWith("GA-")) {
    return `${kind === "ecard" ? "EC" : "GV"}-${giftCode.slice(3)}`;
  }
  return giftCode;
}

function normalizeGiftExpiresAt(expiresAt: string, sentAt: string) {
  const relativeMatch = expiresAt.match(/^Valid for (\d+) days$/i);
  if (!relativeMatch) {
    return expiresAt;
  }
  const sentDate = new Date(sentAt.replace(" ", "T"));
  if (Number.isNaN(sentDate.getTime())) {
    return expiresAt;
  }
  const validDays = Number(relativeMatch[1]);
  return formatActivityDateTime(sentDate.getTime() + validDays * 24 * 60 * 60 * 1000);
}

type BusinessIdPrefix = "ORD" | "PAY" | "AF" | "GFT" | "VC" | "CP" | "PV" | "RDM";

function normalizeOrderNumber(value: string, date?: string) {
  if (/^ORD-\d{6}-\d{6}$/.test(value)) {
    return value;
  }
  const legacyMatch = value.match(/^GA(\d+)$/);
  if (!legacyMatch) {
    return value;
  }
  return createBusinessIdFromDate("ORD", date, legacyMatch[1]);
}

function normalizeOrderNumberReferences(value: string, date?: string) {
  return value
    .replace(/\bGA(\d+)\b/g, (_, digits: string) => createBusinessIdFromDate("ORD", date, digits))
    .replace(/\bOrder #(?=ORD-\d{6}-\d{6})/g, "");
}

function createBusinessId(prefix: BusinessIdPrefix, timestamp: number) {
  return createBusinessIdFromDate(prefix, formatActivityDateTime(timestamp), String(timestamp));
}

export function createPartnerVoucherCode(timestamp: number) {
  return createBusinessId("PV", timestamp);
}

function createBusinessIdFromDate(prefix: BusinessIdPrefix | string, date: string | undefined, seed: string) {
  return `${prefix}-${formatBusinessDate(date)}-${formatBusinessSequence(seed)}`;
}

function formatBusinessDate(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return "000000";
  }
  return `${match[1].slice(-2)}${match[2]}${match[3]}`;
}

function formatBusinessSequence(seed: string) {
  const digits = seed.replace(/\D/g, "");
  return (digits || "0").slice(-6).padStart(6, "0");
}

export function claimCoupon(state: PersistedAppState, couponId: string): PersistedAppState {
  if (state.claimedCouponIds.includes(couponId)) {
    return state;
  }
  return {
    ...state,
    claimedCouponIds: [couponId, ...state.claimedCouponIds]
  };
}

export function purchasePartnerOffer(
  state: PersistedAppState,
  offer: {
    id: string;
    title: string;
    price?: string;
    purchaseCategory?: "set_menu" | "ticket";
  },
  paymentOrCreatedAt: {
    methodId: "wallet" | "card" | "apple-pay" | "google-pay" | "paypal";
    methodTitle: string;
    amount?: number;
    pointsRedeemed?: number;
    benefitTitle?: string;
  } | number = {
    methodId: "wallet",
    methodTitle: "Wallet eCard"
  },
  createdAtArg = Date.now()
): PersistedAppState {
  const payment = typeof paymentOrCreatedAt === "number"
    ? { methodId: "wallet" as const, methodTitle: "Wallet eCard" }
    : paymentOrCreatedAt;
  const createdAt = typeof paymentOrCreatedAt === "number" ? paymentOrCreatedAt : createdAtArg;
  const fullAmount = parseCurrency(offer.price ?? "$0");
  const amount = roundCurrency(Math.max(0, payment.amount ?? fullAmount));
  const pointsRedeemed = Math.max(0, Math.floor(payment.pointsRedeemed ?? 0));
  const isWalletPayment = payment.methodId === "wallet";
  if (isWalletPayment && state.cashBalance < amount) {
    return state;
  }
  if (pointsRedeemed > state.pointsBalance) {
    return state;
  }
  const transactionId = createBusinessId("PAY", createdAt);
  const voucherCode = createBusinessId("PV", createdAt);
  const displayDate = formatActivityDateTime(createdAt);
  const cashUsed = isWalletPayment ? amount : 0;
  const rewardsBonusBalance = state.rewardsBonusBalance;
  const cashBalance = isWalletPayment
    ? roundCurrency(Math.max(0, state.cashBalance - cashUsed))
    : state.cashBalance;
  const purchaseLabel = offer.purchaseCategory === "ticket" ? "Partner ticket" : "Partner voucher";
  return {
    ...state,
    cashBalance,
    rewardsBonusBalance,
    pointsBalance: state.pointsBalance - pointsRedeemed,
    purchasedPartnerOffers: [
      {
        offerId: offer.id,
        code: voucherCode,
        purchasedAt: displayDate
      },
      ...state.purchasedPartnerOffers
    ],
    paymentHistory: [
      ...(pointsRedeemed > 0 ? [{
        id: `partner-points-redemption-${createdAt}`,
        transactionId: createBusinessId("RDM", createdAt),
        title: payment.benefitTitle ?? "Use Points",
        description: `${purchaseLabel} · ${voucherCode}`,
        date: displayDate,
        amount: 0,
        method: "Wallet eCard" as const,
        status: "Completed" as const,
        points: -pointsRedeemed,
        type: "Partner Offer" as const
      }] : []),
      {
        id: `partner-payment-${createdAt}`,
        transactionId,
        title: offer.title,
        description: `${purchaseLabel} · ${voucherCode}`,
        date: displayDate,
        amount: -amount,
        method: getPartnerPaymentHistoryMethod(payment.methodId),
        status: "Paid",
        points: 0,
        type: "Partner Offer"
      },
      ...state.paymentHistory
    ],
    walletHistory: [
      ...(cashUsed > 0 ? [{
        id: `partner-cash-${createdAt}`,
        transactionId,
        title: "Partner offer payment",
        description: `${offer.title} · ${voucherCode}`,
        date: displayDate,
        amount: -cashUsed,
        balanceAfter: cashBalance + rewardsBonusBalance,
        type: "Payment" as const,
        account: "Cash" as const
      }] : []),
      ...state.walletHistory
    ]
  };
}

function getPartnerPaymentHistoryMethod(
  methodId: "wallet" | "card" | "apple-pay" | "google-pay" | "paypal"
) {
  switch (methodId) {
    case "apple-pay":
      return "Apple Pay";
    case "google-pay":
      return "Google Pay";
    case "paypal":
      return "PayPal";
    case "card":
      return "Credit Card";
    case "wallet":
    default:
      return "Wallet eCard";
  }
}

export function setAppTheme(state: PersistedAppState, themeId: AppThemeId): PersistedAppState {
  if (state.themeId === themeId) {
    return state;
  }
  return { ...state, themeId };
}

export function setProductDisplayPreference(
  state: PersistedAppState,
  area: ProductDisplayArea,
  mode: ProductDisplayOverride
): PersistedAppState {
  if (state.productDisplayPreferences[area] === mode) {
    return state;
  }
  return {
    ...state,
    productDisplayPreferences: {
      ...state.productDisplayPreferences,
      [area]: mode
    }
  };
}

export function setProductDisplayDefaultMode(
  state: PersistedAppState,
  mode: ProductDisplayMode
): PersistedAppState {
  if (state.productDisplayPreferences.defaultMode === mode) {
    return state;
  }
  return {
    ...state,
    productDisplayPreferences: {
      ...state.productDisplayPreferences,
      defaultMode: mode
    }
  };
}

export function resolveProductDisplayMode(
  preferences: ProductDisplayPreferences,
  area: ProductDisplayArea
): ProductDisplayMode {
  const override = preferences[area];
  return override === "default" ? preferences.defaultMode : override;
}

export function setDefaultPaymentMethod(
  state: PersistedAppState,
  methodId: PaymentMethodId
): PersistedAppState {
  if (state.defaultPaymentMethod === methodId) {
    return state;
  }
  return { ...state, defaultPaymentMethod: methodId };
}

export function setAutoReloadSettings(
  state: PersistedAppState,
  settings: AutoReloadSettings
): PersistedAppState {
  return {
    ...state,
    autoReloadSettings: normalizeAutoReloadSettings(settings, state.autoReloadSettings)
  };
}

function normalizeAutoReloadSettings(
  value: unknown,
  fallback: AutoReloadSettings
): AutoReloadSettings {
  if (!isRecord(value)) {
    return fallback;
  }
  const threshold = finiteNumber(value.threshold, fallback.threshold);
  const amount = finiteNumber(value.amount, fallback.amount);
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : fallback.enabled,
    threshold: autoReloadThresholds.includes(threshold) ? threshold : fallback.threshold,
    amount: autoReloadAmounts.includes(amount) ? amount : fallback.amount
  };
}

function normalizePaymentMethodId(
  value: unknown,
  fallback: PaymentMethodId
): PaymentMethodId {
  return value === "wallet" ||
    value === "card" ||
    value === "apple-pay" ||
    value === "google-pay" ||
    value === "paypal"
    ? value
    : fallback;
}

function isAppThemeId(value: unknown): value is AppThemeId {
  return (
    value === "classic" ||
    value === "vibrant" ||
    value === "urbanPulse" ||
    value === "cupertino" ||
    value === "vividNature"
  );
}

function normalizeThemeId(value: unknown, fallback: AppThemeId): AppThemeId {
  return isAppThemeId(value) ? value : fallback;
}

function normalizeProductDisplayMode(value: unknown, fallback: ProductDisplayMode): ProductDisplayMode {
  return value === "row" || value === "card" ? value : fallback;
}

function normalizeProductDisplayOverride(
  value: unknown,
  fallback: ProductDisplayOverride,
  defaultMode: ProductDisplayMode
): ProductDisplayOverride {
  if (value === "default") {
    return "default";
  }
  if (value === "row" || value === "card") {
    return value === defaultMode ? "default" : value;
  }
  return fallback;
}

function normalizeProductDisplayPreferences(
  value: unknown,
  fallback: ProductDisplayPreferences
): ProductDisplayPreferences {
  if (!isRecord(value)) {
    return fallback;
  }
  const legacyMode = normalizeProductDisplayMode(value.productDisplayMode, fallback.defaultMode);
  const preferences = isRecord(value.productDisplayPreferences) ? value.productDisplayPreferences : null;
  const defaultMode = normalizeProductDisplayMode(preferences?.defaultMode, legacyMode);
  return {
    defaultMode,
    homeBestSellers: normalizeProductDisplayOverride(preferences?.homeBestSellers, fallback.homeBestSellers, defaultMode),
    orderAllMenu: normalizeProductDisplayOverride(preferences?.orderAllMenu, fallback.orderAllMenu, defaultMode),
    homePartnerOffers: normalizeProductDisplayOverride(preferences?.homePartnerOffers, fallback.homePartnerOffers, defaultMode),
    allPartnerOffers: normalizeProductDisplayOverride(preferences?.allPartnerOffers, fallback.allPartnerOffers, defaultMode)
  };
}

export function addCartItem(
  state: PersistedAppState,
  item: CartItem,
  maxQuantity = Number.MAX_SAFE_INTEGER
): PersistedAppState {
  const cartKey = getCartKey(item);
  const currentQuantity = state.cartItems[cartKey]?.quantity ?? 0;
  const quantity = Math.min(maxQuantity, currentQuantity + item.quantity);

  return {
    ...state,
    cartItems: {
      ...state.cartItems,
      [cartKey]: { ...item, quantity }
    }
  };
}

export function removeCartItem(state: PersistedAppState, cartKey: string): PersistedAppState {
  const cartItems = { ...state.cartItems };
  delete cartItems[cartKey];
  return { ...state, cartItems };
}

export function toggleFavorite(state: PersistedAppState, skuId: string): PersistedAppState {
  return {
    ...state,
    favoriteSkuIds: state.favoriteSkuIds.includes(skuId)
      ? state.favoriteSkuIds.filter((id) => id !== skuId)
      : [...state.favoriteSkuIds, skuId]
  };
}

export function applyTopUp(
  state: PersistedAppState,
  result: TopUpResult,
  createdAt = Date.now()
): PersistedAppState {
  const transactionId = createBusinessId("AF", createdAt);
  const paymentMethod = getTopUpHistoryMethod(result.paymentMethodId);
  const displayDate = formatActivityDateTime(createdAt);
  const cashBalance = state.cashBalance + result.amount;
  const rewardsBonusBalance = state.rewardsBonusBalance + result.rewardsBonus;
  const availableBalance = cashBalance + rewardsBonusBalance;
  const xp = calculateAddFundsXp(result.amount);
  const xpRecord = createXpRecord(
    `add-funds:${transactionId}`,
    "Add Funds contribution",
    `${formatCurrency(result.amount)} added to Wallet eCard`,
    xp,
    "Wallet",
    createdAt
  );

  return {
    ...state,
    cashBalance,
    rewardsBonusBalance,
    xpBalance: state.xpBalance + xp,
    xpHistory: [xpRecord, ...state.xpHistory],
    xpAwardKeys: [xpRecord.eventKey, ...state.xpAwardKeys],
    paymentHistory: [
      {
        id: `payment-${createdAt}`,
        transactionId,
        title: "Add Funds",
        description: `Cash +${formatCurrency(result.amount)} · Bonus +${formatCurrency(result.rewardsBonus)}`,
        date: displayDate,
        amount: result.amount + result.rewardsBonus,
        paidAmount: result.amount,
        rewardsBonusAmount: result.rewardsBonus,
        method: paymentMethod,
        status: "Completed",
        points: 0,
        type: "Top Up"
      },
      ...state.paymentHistory
    ],
    walletHistory: [
      {
        id: `wallet-rewards-bonus-${createdAt}`,
        transactionId,
        title: "Rewards Bonus",
        description: `Add Funds reward · Linked to ${transactionId}`,
        date: displayDate,
        amount: result.rewardsBonus,
        balanceAfter: availableBalance,
        type: "Rewards Bonus",
        account: "Rewards Bonus"
      },
      {
        id: `wallet-cash-${createdAt}`,
        transactionId,
        title: "Cash Balance Added",
        description: `${paymentMethod} · ${transactionId}`,
        date: displayDate,
        amount: result.amount,
        balanceAfter: cashBalance,
        type: "Top Up",
        account: "Cash"
      },
      ...state.walletHistory
    ]
  };
}

export function applyCheckout(
  state: PersistedAppState,
  result: CheckoutResult,
  createdAt = Date.now(),
  resolveSkuName: (skuId: string) => string | undefined = () => undefined
): PersistedAppState {
  if (result.paymentMethodId === "wallet" && state.cashBalance + state.rewardsBonusBalance < result.amount) {
    return state;
  }
  const pointsRedeemed = result.pointsRedeemed ?? 0;
  if (pointsRedeemed > state.pointsBalance) {
    return state;
  }

  const orderNumber = createBusinessId("ORD", createdAt);
  const transactionId = createBusinessId("PAY", createdAt);
  const displayDate = formatActivityDateTime(createdAt);
  const xp = calculatePurchaseXp(result.amount);
  const xpRecord = xp > 0
    ? createXpRecord(
        `purchase:${transactionId}`,
        "Purchase contribution",
        `${formatCurrency(result.amount)} eligible app purchase`,
        xp,
        "Purchase",
        createdAt
      )
    : null;
  const orderItems = result.items.map((item) => {
    return {
      skuId: item.skuId,
      name: resolveSkuName(item.skuId) ?? "Drink",
      quantity: item.quantity,
      customizationSummary: item.customizationSummary
    };
  });
  const newOrder: OrderRecord = {
    id: `order-${createdAt}`,
    orderNumber,
    title: result.title,
    date: displayDate,
    amount: formatCurrency(result.amount),
    orderMode: "app_preorder",
    status: "Ready to collect",
    itemCount: result.itemCount,
    paymentMethod: result.paymentMethod,
    points: result.points,
    items: orderItems,
    pickupCode: `${String(createdAt).slice(-6, -3)} ${String(createdAt).slice(-3)}`,
    pickupExpiresAt: "Within 23 hr 59 min",
    pickupExpiresAtEpoch: createdAt + PREPAID_COLLECTION_WINDOW_MS,
    redemptionToken: `redeem-${orderNumber.toLowerCase()}-${String(createdAt)}`
  };

  let cashBalance = state.cashBalance;
  let rewardsBonusBalance = state.rewardsBonusBalance;
  let walletEntries: WalletHistoryRecord[] = [];
  if (result.paymentMethodId === "wallet") {
    const rewardsBonusUsed = Math.min(rewardsBonusBalance, result.amount);
    const cashUsed = Math.max(0, result.amount - rewardsBonusUsed);
    const availableBefore = cashBalance + rewardsBonusBalance;
    rewardsBonusBalance = Math.max(0, rewardsBonusBalance - rewardsBonusUsed);
    cashBalance = Math.max(0, cashBalance - cashUsed);
    walletEntries = [
      ...(cashUsed > 0 ? [{
        id: `wallet-cash-payment-${createdAt}`,
        transactionId,
        title: "Cash payment",
        description: `${result.title} · ${orderNumber} · ${transactionId}`,
        date: displayDate,
        amount: -cashUsed,
        balanceAfter: availableBefore - rewardsBonusUsed - cashUsed,
        type: "Payment" as const,
        account: "Cash" as const
      }] : []),
      ...(rewardsBonusUsed > 0 ? [{
        id: `wallet-rewards-bonus-payment-${createdAt}`,
        transactionId,
        title: "Rewards Bonus payment",
        description: `${result.title} · Rewards Bonus used first`,
        date: displayDate,
        amount: -rewardsBonusUsed,
        balanceAfter: availableBefore - rewardsBonusUsed,
        type: "Payment" as const,
        account: "Rewards Bonus" as const
      }] : [])
    ];
  }

  const cartItems = { ...state.cartItems };
  result.items.forEach((item) => delete cartItems[getCartKey(item)]);
  const usedBenefitKeys = getUsedBenefitKeys(result.benefitsApplied);
  const usedBenefitIds = mergeUniqueStrings(state.usedBenefitIds, usedBenefitKeys);
  const existingUsedBenefitKeys = new Set(state.usedBenefitRecords.map((record) => record.key));
  const usedBenefitRecords = [
    ...usedBenefitKeys
      .filter((key) => !existingUsedBenefitKeys.has(key))
      .map((key) => ({ key, usedAt: displayDate })),
    ...state.usedBenefitRecords
  ];
  const redeemedPointRewards = state.redeemedPointRewards.map((reward) =>
    usedBenefitKeys.includes(createBenefitUsageKey("Points Reward", reward.id))
      ? { ...reward, status: "Used" as const, usedAt: displayDate }
      : reward
  );

  return {
    ...state,
    cashBalance,
    rewardsBonusBalance,
    pointsBalance: state.pointsBalance + result.points - pointsRedeemed,
    xpBalance: state.xpBalance + xp,
    xpHistory: xpRecord ? [xpRecord, ...state.xpHistory] : state.xpHistory,
    xpAwardKeys: xpRecord ? [xpRecord.eventKey, ...state.xpAwardKeys] : state.xpAwardKeys,
    cartItems,
    usedBenefitIds,
    usedBenefitRecords,
    redeemedPointRewards,
    orders: [newOrder, ...state.orders],
    paymentHistory: [
      ...(pointsRedeemed > 0 ? [{
        id: `points-redemption-${createdAt}`,
        transactionId: createBusinessId("RDM", createdAt),
        title: result.benefitsApplied?.find((benefit) => benefit.type === "Points")?.title ?? "Points redemption",
        description: `${orderNumber} · Applied at checkout`,
        date: displayDate,
        amount: 0,
        method: "Wallet eCard" as const,
        status: "Completed" as const,
        points: -pointsRedeemed,
        type: "Order" as const
      }] : []),
      {
        id: `payment-${createdAt}`,
        transactionId,
        title: result.title,
        description: `Prepaid Order · ${orderNumber}`,
        date: displayDate,
        amount: -result.amount,
        method: getCheckoutHistoryMethod(result.paymentMethodId),
        status: "Paid",
        points: result.points,
        type: "Order"
      },
      ...state.paymentHistory
    ],
    walletHistory: [...walletEntries, ...state.walletHistory]
  };
}

export function createBenefitUsageKey(type: "Voucher" | "Coupon" | "Points Reward" | "Member Benefit", id: string) {
  return `${type}:${id}`;
}

function getUsedBenefitKeys(benefitsApplied: CheckoutResult["benefitsApplied"]) {
  if (!benefitsApplied?.length) {
    return [];
  }
  return benefitsApplied.flatMap((benefit) => {
    if (benefit.type === "Points" && benefit.id !== "points-instant-redeem") {
      return [createBenefitUsageKey("Points Reward", benefit.id)];
    }
    if (benefit.type === "Voucher" || benefit.type === "Coupon" || benefit.type === "Member Benefit") {
      return [createBenefitUsageKey(benefit.type, benefit.id)];
    }
    return [];
  });
}

function mergeUniqueStrings(current: string[], additions: string[]) {
  if (!additions.length) {
    return current;
  }
  return Array.from(new Set([...additions, ...current]));
}

export function applyGiftPurchase(
  state: PersistedAppState,
  result: GiftPurchaseResult,
  createdAt = Date.now()
): PersistedAppState {
  const usesWallet = result.paymentMethodId === "wallet";
  const payableAmount = roundCurrency(Math.max(0, result.payableAmount ?? result.amount));
  const pointsRedeemed = Math.max(0, Math.floor(result.pointsRedeemed ?? 0));
  if (usesWallet && state.cashBalance + state.rewardsBonusBalance < payableAmount) {
    return state;
  }
  if (pointsRedeemed > state.pointsBalance) {
    return state;
  }

  const transactionId = createBusinessId("GFT", createdAt);
  const giftCode = createGiftCode(result.kind, createdAt);
  const displayDate = formatActivityDateTime(createdAt);
  const validDays = result.validDays ?? 30;
  const expiresAt = formatActivityDateTime(createdAt + validDays * 24 * 60 * 60 * 1000);
  const rewardsBonusUsed = usesWallet
    ? Math.min(state.rewardsBonusBalance, payableAmount)
    : 0;
  const cashUsed = usesWallet ? Math.max(0, payableAmount - rewardsBonusUsed) : 0;
  const rewardsBonusBalance = Math.max(0, state.rewardsBonusBalance - rewardsBonusUsed);
  const cashBalance = Math.max(0, state.cashBalance - cashUsed);
  const gift: GiftRecord = {
    id: `gift-${createdAt}`,
    giftCode,
    kind: result.kind,
    title: result.title,
    recipientName: result.recipientName,
    recipientContact: result.recipientContact,
    message: result.message,
    occasion: result.occasion,
    amount: result.amount,
    status: "Sent",
    date: displayDate,
    expiresAt,
    skuId: result.skuId,
    redemptionScope: result.redemptionScope,
    validDays: result.validDays
  };
  const xp = XP_RULES.sendGift;
  const xpRecord = createXpRecord(
    `send-gift:${transactionId}`,
    result.kind === "ecard" ? "Send an eCard" : "Send a Gift Voucher",
    `Gift sent to ${result.recipientName}`,
    xp,
    "Gift",
    createdAt
  );

  return {
    ...state,
    cashBalance,
    rewardsBonusBalance,
    pointsBalance: state.pointsBalance - pointsRedeemed,
    xpBalance: state.xpBalance + xp,
    xpHistory: [xpRecord, ...state.xpHistory],
    xpAwardKeys: [xpRecord.eventKey, ...state.xpAwardKeys],
    sentGifts: [gift, ...state.sentGifts],
    paymentHistory: [
      ...(pointsRedeemed > 0 ? [{
        id: `gift-points-redemption-${createdAt}`,
        transactionId: createBusinessId("RDM", createdAt),
        title: result.benefitsApplied?.find((benefit) => benefit.type === "Points")?.title ?? "Use Points",
        description: `Gift for ${result.recipientName} · ${giftCode}`,
        date: displayDate,
        amount: 0,
        method: "Wallet eCard" as const,
        status: "Completed" as const,
        points: -pointsRedeemed,
        type: "Gift" as const
      }] : []),
      {
        id: `gift-payment-${createdAt}`,
        transactionId,
        title: result.title,
        description: `Gift for ${result.recipientName} · ${giftCode}`,
        date: displayDate,
        amount: -payableAmount,
        method: getCheckoutHistoryMethod(result.paymentMethodId),
        status: "Paid",
        points: 0,
        type: "Gift"
      },
      ...state.paymentHistory
    ],
    walletHistory: [
      ...(cashUsed > 0 ? [{
        id: `gift-cash-${createdAt}`,
        transactionId,
        title: "Gift payment",
        description: `${result.title} · ${giftCode}`,
        date: displayDate,
        amount: -cashUsed,
        balanceAfter: cashBalance + rewardsBonusBalance,
        type: "Payment" as const,
        account: "Cash" as const
      }] : []),
      ...(rewardsBonusUsed > 0 ? [{
        id: `gift-rewards-bonus-${createdAt}`,
        transactionId,
        title: "Gift Rewards Bonus payment",
        description: `${result.title} · Rewards Bonus used first`,
        date: displayDate,
        amount: -rewardsBonusUsed,
        balanceAfter: state.cashBalance + rewardsBonusBalance,
        type: "Payment" as const,
        account: "Rewards Bonus" as const
      }] : []),
      ...state.walletHistory
    ]
  };
}

export function applyXpAction(
  state: PersistedAppState,
  action: XpAction,
  eventKey: string,
  createdAt = Date.now()
): PersistedAppState {
  if (state.xpAwardKeys.includes(eventKey)) {
    return state;
  }

  if (action === "daily-check-in") {
    return applyDailyCheckIn(state, createdAt);
  }

  const config = getXpActionConfig(action);
  const record = createXpRecord(
    eventKey,
    config.title,
    config.description,
    config.amount,
    config.type,
    createdAt
  );
  return {
    ...state,
    xpBalance: state.xpBalance + config.amount,
    xpHistory: [record, ...state.xpHistory],
    xpAwardKeys: [eventKey, ...state.xpAwardKeys]
  };
}

export function redeemPoints(
  state: PersistedAppState,
  reward: { id: string; title: string; pointsCost: number; validDays?: number; rewardType: "Coupon" | "Voucher" },
  createdAt = Date.now()
): PersistedAppState {
  if (state.pointsBalance < reward.pointsCost) {
    return state;
  }
  const transactionId = createBusinessId("RDM", createdAt);
  const displayDate = formatActivityDateTime(createdAt);
  const validDays = reward.validDays ?? POINT_REWARD_VALID_DAYS;
  const expiresAt = new Date(createdAt + validDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const pointReward: RedeemedPointReward = {
    id: `point-reward-${reward.id}-${createdAt}`,
    code: createBusinessId(reward.rewardType === "Coupon" ? "CP" : "VC", createdAt),
    title: reward.title,
    description: reward.rewardType === "Coupon" ? "Redeemed with Points for app checkout." : "Redeemed with Points for VM pickup.",
    rewardType: reward.rewardType,
    pointsCost: reward.pointsCost,
    status: "Active",
    date: displayDate,
    expiresAt
  };
  return {
    ...state,
    pointsBalance: state.pointsBalance - reward.pointsCost,
    redeemedPointRewards: [pointReward, ...state.redeemedPointRewards],
    paymentHistory: [
      {
        id: `points-redemption-${reward.id}-${createdAt}`,
        transactionId,
        title: reward.title,
        description: `${reward.rewardType} · Added to My Rewards`,
        date: displayDate,
        amount: 0,
        method: "Wallet eCard",
        status: "Completed",
        points: -reward.pointsCost,
        type: "Refund"
      },
      ...state.paymentHistory
    ]
  };
}

function applyDailyCheckIn(
  state: PersistedAppState,
  createdAt: number
): PersistedAppState {
  const dateKey = formatDateKey(createdAt);
  const eventKey = `daily-check-in:${dateKey}`;
  if (state.xpAwardKeys.includes(eventKey)) {
    return state;
  }

  const previousDateKey = formatDateKey(createdAt - 24 * 60 * 60 * 1000);
  const nextStreak =
    state.lastCheckInDate === previousDateKey ? state.checkInStreak + 1 : 1;
  const streakBonus =
    nextStreak % 7 === 0 ? XP_RULES.sevenDayStreak : 0;
  const amount = XP_RULES.dailyCheckIn + streakBonus;
  const record = createXpRecord(
    eventKey,
    streakBonus > 0 ? "7-day check-in streak" : "Daily check-in",
    streakBonus > 0
      ? `Daily check-in +${XP_RULES.dailyCheckIn} XP · 7-day bonus +${streakBonus} XP`
      : `Day ${nextStreak} check-in`,
    amount,
    "Activity",
    createdAt
  );

  return {
    ...state,
    xpBalance: state.xpBalance + amount,
    xpHistory: [record, ...state.xpHistory],
    xpAwardKeys: [eventKey, ...state.xpAwardKeys],
    checkInStreak: nextStreak,
    lastCheckInDate: dateKey
  };
}

function getXpActionConfig(action: Exclude<XpAction, "daily-check-in">) {
  switch (action) {
    case "review":
      return {
        title: "Review completed",
        description: "Shared product feedback",
        amount: XP_RULES.review,
        type: "Activity" as const
      };
    case "photo-review":
      return {
        title: "Photo review completed",
        description: "Shared a review with a photo",
        amount: XP_RULES.photoReview,
        type: "Activity" as const
      };
    case "nearby-deals":
      return {
        title: "Nearby Deals used",
        description: "Discovered a nearby partner offer",
        amount: XP_RULES.nearbyDeals,
        type: "Activity" as const
      };
    case "campaign":
      return {
        title: "Campaign participation",
        description: "Completed an eligible member campaign",
        amount: XP_RULES.campaign,
        type: "Activity" as const
      };
    case "invite-registration":
      return {
        title: "Friend joined",
        description: "Invited friend completed registration",
        amount: XP_RULES.inviteRegistration,
        type: "Referral" as const
      };
    case "invite-first-order":
      return {
        title: "Friend completed first order",
        description: "Referral milestone completed",
        amount: XP_RULES.inviteFirstOrder,
        type: "Referral" as const
      };
  }
}

function createXpRecord(
  eventKey: string,
  title: string,
  description: string,
  amount: number,
  type: XpRecord["type"],
  createdAt: number
): XpRecord {
  return {
    id: `xp-${createdAt}-${eventKey}`,
    eventKey,
    title,
    description,
    date: formatActivityDateTime(createdAt),
    amount,
    type
  };
}

function formatDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createGiftCode(kind: GiftRecord["kind"], createdAt: number) {
  const prefix = kind === "ecard" ? "EC" : "GV";
  const date = new Date(createdAt);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${prefix}-${year}${month}${day}-${String(createdAt).slice(-4)}`;
}

export function expireEligibleOrders(
  state: PersistedAppState,
  now = Date.now()
): PersistedAppState {
  const expiredOrders = state.orders
    .filter(
      (order) =>
        order.orderMode === "app_preorder" &&
        order.status === "Ready to collect" &&
        Boolean(order.pickupExpiresAtEpoch) &&
        now >= (order.pickupExpiresAtEpoch ?? 0)
    )
    .sort(
      (first, second) =>
        (first.pickupExpiresAtEpoch ?? 0) - (second.pickupExpiresAtEpoch ?? 0)
    );

  if (expiredOrders.length === 0) {
    return state;
  }

  const expiredOrderIds = new Set(expiredOrders.map((order) => order.id));
  let rewardsBonusBalance = state.rewardsBonusBalance;
  const walletEntries: WalletHistoryRecord[] = [];

  expiredOrders.forEach((order) => {
    const creditAmount = parseCurrency(order.amount);
    if (creditAmount <= 0) {
      return;
    }

    rewardsBonusBalance = roundCurrency(rewardsBonusBalance + creditAmount);
    const transactionId = `EXP-${order.orderNumber}`;
    walletEntries.push({
      id: `wallet-expired-${order.id}`,
      transactionId,
      title: "Expired order credit",
      description: `${order.orderNumber} · Moved to Rewards Bonus Balance`,
      date: formatActivityDateTime(now),
      amount: creditAmount,
      balanceAfter: roundCurrency(state.cashBalance + rewardsBonusBalance),
      type: "Rewards Bonus",
      account: "Rewards Bonus",
      relatedOrderNumber: order.orderNumber,
      originalPaymentMethod: order.paymentMethod,
      originalPaidAmount: creditAmount,
      originalPaidAt: order.date,
      expiredAt: formatActivityDateTime(now),
      creditedTo: "Bonus Balance"
    });
  });

  return {
    ...state,
    rewardsBonusBalance,
    orders: state.orders.map((order) =>
      expiredOrderIds.has(order.id)
        ? {
            ...order,
            status: "Expired",
            pickupCode: undefined,
            redemptionToken: undefined
          }
        : order
    ),
    walletHistory: [...walletEntries.reverse(), ...state.walletHistory]
  };
}

export function getOrderCollectionState(order: OrderRecord, now = Date.now()) {
  if (order.status === "Expired") {
    return "expired";
  }

  const isPreOrder = order.orderMode === "app_preorder";
  const isReady = isPreOrder && order.status === "Ready to collect";
  const isExpired = isReady && Boolean(order.pickupExpiresAtEpoch) && now >= (order.pickupExpiresAtEpoch ?? 0);

  if (isExpired) {
    return "expired";
  }
  if (isReady && order.pickupCode) {
    return "ready";
  }
  return "unavailable";
}

export function getCartKey(item: Pick<CartItem, "skuId" | "customizationSummary">) {
  return `${item.skuId}:${item.customizationSummary}`;
}

function getTopUpHistoryMethod(methodId: TopUpResult["paymentMethodId"]): PaymentHistoryRecord["method"] {
  if (methodId === "apple-pay") return "Apple Pay";
  if (methodId === "google-pay") return "Google Pay";
  if (methodId === "paypal") return "PayPal";
  return "Credit Card";
}

function getCheckoutHistoryMethod(
  methodId: CheckoutResult["paymentMethodId"]
): PaymentHistoryRecord["method"] {
  if (methodId === "wallet") return "Wallet eCard";
  return getTopUpHistoryMethod(methodId);
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function parseCurrency(value: string) {
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatActivityDateTime(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
