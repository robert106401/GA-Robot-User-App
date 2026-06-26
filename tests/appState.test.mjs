import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartItem,
  applyCheckout,
  applyGiftPurchase,
  applyTopUp,
  applyXpAction,
  claimCoupon,
  createInitialAppState,
  expireEligibleOrders,
  getOrderCollectionState,
  normalizePersistedAppState,
  purchasePartnerOffer,
  redeemPoints,
  setDefaultPaymentMethod,
  setAppTheme,
  setProductDisplayDefaultMode,
  setProductDisplayPreference,
  toggleFavorite
} from "../src/state/appState.ts";
import {
  addFundsOffers,
  calculatePurchasePoints
} from "../src/rewards.ts";
import { getTierByExp } from "../src/tiers.ts";
import { calculateTierColumnOffset } from "../src/tierTable.ts";
import { getEligibleDefaultPaymentMethod } from "../src/paymentMethods.ts";
import { calculateAddFundsXp, calculatePurchaseXp, XP_RULES } from "../src/xp.ts";
import {
  formatCardExpiryInput,
  formatCardNumberInput,
  isValidCardExpiry
} from "../src/cardInput.ts";

const cartItem = {
  skuId: "sku-1",
  quantity: 2,
  customizationSummary: "Iced · No Milk"
};

const initialXpBalance = createInitialAppState().xpBalance;

test("cart quantities merge and never exceed current stock", () => {
  const initial = createInitialAppState();
  const once = addCartItem(initial, cartItem, 18);
  const many = addCartItem(once, { ...cartItem, quantity: 99 }, 18);

  assert.equal(once.cartItems["sku-1:Iced · No Milk"].quantity, 2);
  assert.equal(many.cartItems["sku-1:Iced · No Milk"].quantity, 18);
});

test("favorites toggle without creating duplicates", () => {
  const initial = createInitialAppState();
  const selected = toggleFavorite(initial, "sku-1");
  const cleared = toggleFavorite(selected, "sku-1");

  assert.deepEqual(selected.favoriteSkuIds, ["sku-1"]);
  assert.deepEqual(cleared.favoriteSkuIds, []);
});

test("theme preference updates and survives normalization", () => {
  const next = setAppTheme(createInitialAppState(), "vibrant");
  const restored = normalizePersistedAppState(next);

  assert.equal(next.themeId, "vibrant");
  assert.equal(restored.themeId, "vibrant");
});

test("product display preferences update separately and survive normalization", () => {
  const defaulted = setProductDisplayDefaultMode(createInitialAppState(), "card");
  const next = setProductDisplayPreference(defaulted, "orderAllMenu", "row");
  const restored = normalizePersistedAppState(next);
  const restoredLegacy = normalizePersistedAppState({ ...next, productDisplayPreferences: undefined, productDisplayMode: "card" });

  assert.deepEqual(createInitialAppState().productDisplayPreferences, {
    defaultMode: "row",
    homeBestSellers: "default",
    orderAllMenu: "default",
    homePartnerOffers: "default",
    allPartnerOffers: "default"
  });
  assert.deepEqual(next.productDisplayPreferences, {
    defaultMode: "card",
    homeBestSellers: "default",
    orderAllMenu: "row",
    homePartnerOffers: "default",
    allPartnerOffers: "default"
  });
  assert.deepEqual(restored.productDisplayPreferences, next.productDisplayPreferences);
  assert.deepEqual(restoredLegacy.productDisplayPreferences, {
    defaultMode: "card",
    homeBestSellers: "default",
    orderAllMenu: "default",
    homePartnerOffers: "default",
    allPartnerOffers: "default"
  });
});

test("wallet is the default payment method and preference persists", () => {
  const initial = createInitialAppState();
  const next = setDefaultPaymentMethod(initial, "apple-pay");

  assert.equal(initial.defaultPaymentMethod, "wallet");
  assert.equal(next.defaultPaymentMethod, "apple-pay");
  assert.equal(normalizePersistedAppState(next).defaultPaymentMethod, "apple-pay");
});

test("default payment method falls back when a mode does not support it", () => {
  assert.equal(getEligibleDefaultPaymentMethod("wallet", "checkout"), "wallet");
  assert.equal(getEligibleDefaultPaymentMethod("wallet", "topup"), "card");
  assert.equal(getEligibleDefaultPaymentMethod("apple-pay", "topup"), "apple-pay");
});

test("urban pulse theme preference survives normalization", () => {
  const next = setAppTheme(createInitialAppState(), "urbanPulse");
  assert.equal(normalizePersistedAppState(next).themeId, "urbanPulse");
});

test("cupertino theme preference survives normalization", () => {
  const next = setAppTheme(createInitialAppState(), "cupertino");
  assert.equal(normalizePersistedAppState(next).themeId, "cupertino");
});

test("claimed coupons persist without duplicate claims", () => {
  const initial = createInitialAppState();
  const claimed = claimCoupon(initial, "coupon-1");
  const duplicate = claimCoupon(claimed, "coupon-1");
  const restored = normalizePersistedAppState(claimed);

  assert.equal(claimed.claimedCouponIds[0], "coupon-1");
  assert.equal(duplicate.claimedCouponIds.filter((id) => id === "coupon-1").length, 1);
  assert.deepEqual(restored.claimedCouponIds, claimed.claimedCouponIds);
});

test("add funds credits cash and rewards bonus without awarding points", () => {
  const next = applyTopUp(createInitialAppState(), {
    amount: 30,
    rewardsBonus: 4,
    paymentMethodId: "card"
  }, 1710000000000);

  assert.equal(next.cashBalance, 50);
  assert.equal(next.rewardsBonusBalance, 8.5);
  assert.equal(next.pointsBalance, 8000);
  assert.equal(next.xpBalance, initialXpBalance + 60);
  assert.equal(next.xpHistory[0].amount, 60);
  assert.equal(next.paymentHistory[0].transactionId, "AF-240309-000000");
  assert.equal(next.paymentHistory[0].description, "Cash +$30.00 · Bonus +$4.00");
  assert.equal(next.paymentHistory[0].points, 0);
  assert.equal(next.xpHistory[0].eventKey, "add-funds:AF-240309-000000");
  assert.equal(next.walletHistory.length, 3);
  assert.equal(next.walletHistory[0].transactionId, "AF-240309-000000");
  assert.equal(next.walletHistory[0].description, "Add Funds reward · Linked to AF-240309-000000");
  assert.equal(next.walletHistory[2].id, "wallet-demo-expired-credit");
});

test("gift purchase spends wallet funds and persists a sent gift", () => {
  const next = applyGiftPurchase(createInitialAppState(), {
    kind: "voucher",
    title: "Any Drink Voucher",
    recipientName: "Jamie",
    recipientContact: "jamie@example.com",
    message: "A drink is on me.",
    occasion: "Good Luck",
    amount: 6,
    paymentMethod: "Wallet eCard",
    paymentMethodId: "wallet",
    redemptionScope: "Any eligible drink"
  }, 1710000000123);

  assert.equal(next.cashBalance, 18.5);
  assert.equal(next.rewardsBonusBalance, 0);
  assert.equal(next.sentGifts[0].recipientName, "Jamie");
  assert.equal(next.sentGifts[0].giftCode, "GV-240309-0123");
  assert.equal(next.paymentHistory[0].transactionId, "GFT-240309-000123");
  assert.equal(next.paymentHistory[0].description, "Gift for Jamie · GV-240309-0123");
  assert.equal(next.paymentHistory[0].type, "Gift");
  assert.equal(next.xpBalance, initialXpBalance + XP_RULES.sendGift);
  assert.equal(next.xpHistory[0].title, "Send a Gift Voucher");
});

test("partner offer purchase spends wallet funds and persists a partner voucher", () => {
  const next = purchasePartnerOffer(createInitialAppState(), {
    id: "offer-cineplex-coquitlam",
    title: "Partner movie ticket",
    price: "$18",
    purchaseCategory: "ticket"
  }, 1710000000456);

  assert.equal(next.cashBalance, 2);
  assert.equal(next.rewardsBonusBalance, 4.5);
  assert.equal(next.purchasedPartnerOffers[0].offerId, "offer-cineplex-coquitlam");
  assert.equal(next.purchasedPartnerOffers[0].code, "PV-240309-000456");
  assert.equal(next.paymentHistory[0].transactionId, "PAY-240309-000456");
  assert.equal(next.paymentHistory[0].description, "Partner ticket · PV-240309-000456");
  assert.equal(next.paymentHistory[0].amount, -18);
  assert.equal(next.paymentHistory[0].method, "Wallet eCard");
  assert.equal(next.paymentHistory[0].type, "Partner Offer");
  assert.equal(next.walletHistory[0].transactionId, "PAY-240309-000456");
  assert.equal(next.walletHistory[0].account, "Cash");
  assert.equal(next.walletHistory[0].amount, -18);
  assert.equal(next.walletHistory.some((record) => record.account === "Rewards Bonus" && record.transactionId === "PAY-240309-000456"), false);
});

test("persisted gift ids and codes migrate to gift-specific prefixes", () => {
  const restored = normalizePersistedAppState({
    ...createInitialAppState(),
    xpHistory: [
      {
        id: "xp-gift",
        eventKey: "send-gift:GIFT0000123",
        title: "Send a Gift Voucher",
        description: "Gift sent to Jamie",
        date: "2026-06-21 10:00",
        amount: XP_RULES.sendGift,
        type: "Gift"
      }
    ],
    xpAwardKeys: ["send-gift:GIFT0000123"],
    sentGifts: [
      {
        id: "gift-1",
        giftCode: "GA-0123-0000",
        kind: "voucher",
        title: "Any Drink Voucher",
        recipientName: "Jamie",
        recipientContact: "+1 604 555 0123",
        message: "Good luck",
        occasion: "Good Luck",
        amount: 6,
        status: "Sent",
        date: "2026-06-21 10:00",
        expiresAt: "Valid for 30 days",
        redemptionScope: "Any eligible drink"
      }
    ],
    paymentHistory: [
      {
        id: "gift-payment-1",
        transactionId: "GIFT0000123",
        title: "Any Drink Voucher",
        description: "Gift for Jamie · GA-0123-0000",
        date: "2026-06-21 10:00",
        amount: -6,
        method: "Wallet eCard",
        status: "Paid",
        points: 0,
        type: "Gift"
      }
    ]
  });

  assert.equal(restored.xpHistory[0].eventKey, "send-gift:GFT-260621-000123");
  assert.equal(restored.xpAwardKeys[0], "send-gift:GFT-260621-000123");
  assert.equal(restored.sentGifts[0].giftCode, "GV-0123-0000");
  assert.equal(restored.paymentHistory[0].transactionId, "GFT-260621-000123");
  assert.equal(restored.paymentHistory[0].description, "Gift for Jamie · GV-0123-0000");
});

test("claimed gift records normalize with a concrete claimed timestamp", () => {
  const restored = normalizePersistedAppState({
    ...createInitialAppState(),
    version: createInitialAppState().version,
    sentGifts: [
      {
        id: "gift-claimed",
        giftCode: "GV-260621-9999",
        kind: "voucher",
        title: "Any Drink Voucher",
        recipientName: "Jamie",
        recipientContact: "+1 604 555 0123",
        message: "Enjoy.",
        occasion: "Birthday",
        amount: 6,
        status: "Claimed",
        date: "2026-06-21 10:00",
        expiresAt: "2026-07-21 10:00",
        redemptionScope: "Any eligible drink"
      }
    ]
  });

  assert.equal(restored.sentGifts[0].claimedAt, "2026-06-21 10:00");
});

test("gift purchase cannot overdraw the wallet", () => {
  const initial = createInitialAppState();
  const next = applyGiftPurchase(initial, {
    kind: "voucher",
    title: "$100 Voucher",
    recipientName: "Jamie",
    recipientContact: "jamie@example.com",
    message: "",
    occasion: "Just Because",
    amount: 100,
    paymentMethod: "Wallet eCard",
    paymentMethodId: "wallet",
    redemptionScope: "Any eligible drink"
  }, 1710000000123);

  assert.equal(next, initial);
});

test("wallet checkout spends eCard balance, awards points, and clears purchased cart rows", () => {
  const withCart = addCartItem(createInitialAppState(), cartItem);
  const next = applyCheckout(withCart, {
    title: "Iced Americano",
    amount: 6.4,
    itemCount: 2,
    paymentMethod: "Wallet eCard",
    paymentMethodId: "wallet",
    points: 64,
    items: [cartItem]
  }, 1710000000123);

  assert.equal(next.cashBalance, 18.1);
  assert.equal(next.rewardsBonusBalance, 0);
  assert.equal(next.pointsBalance, 8064);
  assert.equal(next.xpBalance, initialXpBalance + 64);
  assert.equal(next.xpHistory[0].type, "Purchase");
  assert.equal(next.orders[0].status, "Ready to collect");
  assert.equal(next.orders[0].orderNumber, "ORD-240309-000123");
  assert.equal(next.paymentHistory[0].transactionId, "PAY-240309-000123");
  assert.equal(next.paymentHistory[0].description, "Prepaid Order · ORD-240309-000123");
  assert.equal(next.xpHistory[0].eventKey, "purchase:PAY-240309-000123");
  assert.equal(next.paymentHistory[0].status, "Paid");
  assert.deepEqual(next.cartItems, {});
});

test("insufficient wallet balance cannot mutate state", () => {
  const initial = createInitialAppState();
  const next = applyCheckout(initial, {
    title: "Large order",
    amount: 999,
    itemCount: 1,
    paymentMethod: "Wallet eCard",
    paymentMethodId: "wallet",
    points: 0,
    items: [cartItem]
  }, 1710000000456);

  assert.equal(next, initial);
});

test("invalid persisted payload falls back to safe defaults", () => {
  const restored = normalizePersistedAppState({ version: 99, cashBalance: "broken" });
  assert.deepEqual(restored, createInitialAppState());
});

test("demo state includes an expired prepaid order linked to bonus credit", () => {
  const initial = createInitialAppState();
  const order = initial.orders.find((record) => record.id === "order-demo-expired-prepaid");
  const walletCredit = initial.walletHistory.find((record) => record.id === "wallet-demo-expired-credit");

  assert.equal(order?.status, "Expired");
  assert.equal(order?.orderMode, "app_preorder");
  assert.equal(order?.orderNumber, "ORD-260621-000042");
  assert.equal(order?.pickupCode, undefined);
  assert.equal(getOrderCollectionState(order), "expired");
  assert.equal(walletCredit?.relatedOrderNumber, order?.orderNumber);

  const restored = normalizePersistedAppState({
    ...initial,
    orders: []
  });
  assert.equal(restored.orders[0].id, "order-demo-expired-prepaid");
});

test("previous persisted state migrates EXP test baseline while keeping user data", () => {
  const restored = normalizePersistedAppState({
    ...createInitialAppState(),
    version: 12,
    cashBalance: 99,
    pointsBalance: 1234,
    xpBalance: 961
  });

  assert.equal(restored.version, 13);
  assert.equal(restored.cashBalance, 99);
  assert.equal(restored.pointsBalance, 1234);
  assert.equal(restored.xpBalance, initialXpBalance);
});

test("persisted payment descriptions drop duplicate transaction id suffix", () => {
  const restored = normalizePersistedAppState({
    ...createInitialAppState(),
    paymentHistory: [
      {
        id: "payment-1",
        transactionId: "PAY12345678",
        title: "Iced Americano",
        description: "Pickup Order · Order #GA123456 · PAY12345678",
        date: "2026-06-21 10:00",
        amount: -5,
        method: "Wallet eCard",
        status: "Paid",
        points: 55,
        type: "Order"
      }
    ]
  });

  assert.equal(restored.paymentHistory[0].transactionId, "PAY-260621-345678");
  assert.equal(restored.paymentHistory[0].description, "Prepaid Order · ORD-260621-123456");
});

test("persisted prepaid order descriptions keep only the order number", () => {
  const restored = normalizePersistedAppState({
    ...createInitialAppState(),
    paymentHistory: [
      {
        id: "payment-1",
        transactionId: "PAY12345678",
        title: "Iced Americano",
        description: "Pickup Order · Order #GA123456 · +55 pts",
        date: "2026-06-21 10:00",
        amount: -5,
        method: "Wallet eCard",
        status: "Paid",
        points: 55,
        type: "Order"
      }
    ]
  });

  assert.equal(restored.paymentHistory[0].transactionId, "PAY-260621-345678");
  assert.equal(restored.paymentHistory[0].description, "Prepaid Order · ORD-260621-123456");
});

test("persisted add funds payment descriptions migrate to short copy", () => {
  const restored = normalizePersistedAppState({
    ...createInitialAppState(),
    xpHistory: [
      {
        id: "xp-1",
        eventKey: "topup:TU12345678",
        title: "Add Funds contribution",
        description: "$100.00 added to Wallet eCard",
        date: "2026-06-21 10:00",
        amount: 200,
        type: "Wallet"
      }
    ],
    xpAwardKeys: ["topup:TU12345678"],
    paymentHistory: [
      {
        id: "payment-1",
        transactionId: "TU12345678",
        title: "Add Funds",
        description: "Paid $100.00 · Rewards Bonus +$15.00",
        date: "2026-06-21 10:00",
        amount: 115,
        paidAmount: 100,
        rewardsBonusAmount: 15,
        method: "Credit Card",
        status: "Completed",
        points: 0,
        type: "Top Up"
      }
    ],
    walletHistory: [
      {
        id: "wallet-1",
        transactionId: "TU12345678",
        title: "Rewards Bonus",
        description: "Add Funds reward · Linked to TU12345678",
        date: "2026-06-21 10:00",
        amount: 15,
        balanceAfter: 115,
        type: "Rewards Bonus",
        account: "Rewards Bonus"
      }
    ]
  });

  assert.equal(restored.xpHistory[0].eventKey, "add-funds:AF-260621-345678");
  assert.equal(restored.xpAwardKeys[0], "add-funds:AF-260621-345678");
  assert.equal(restored.paymentHistory[0].transactionId, "AF-260621-345678");
  assert.equal(restored.paymentHistory[0].description, "Cash +$100.00 · Bonus +$15.00");
  const addFundsWalletRecord = restored.walletHistory.find((record) => record.transactionId === "AF-260621-345678");
  assert.equal(addFundsWalletRecord?.description, "Add Funds reward · Linked to AF-260621-345678");
  assert.equal(restored.walletHistory[0].id, "wallet-demo-expired-credit");
});

test("purchase points use tier Points per dollar and add funds offers match configuration", () => {
  assert.equal(calculatePurchasePoints(10, 13), 130);
  assert.deepEqual(
    addFundsOffers.map(({ amount, rewardsBonus }) => [amount, rewardsBonus]),
    [[10, 1], [30, 4], [50, 7], [100, 15]]
  );
});

test("xp rules award purchase, wallet, gift and behavior contributions", () => {
  assert.equal(calculatePurchaseXp(12.34), 123);
  assert.equal(calculateAddFundsXp(30), 60);

  const sentCoffee = applyGiftPurchase(createInitialAppState(), {
    kind: "ecard",
    title: "$10 Wallet eCard",
    recipientName: "Jamie",
    recipientContact: "jamie@example.com",
    message: "Enjoy",
    occasion: "Just Because",
    amount: 10,
    paymentMethod: "Apple Pay",
    paymentMethodId: "apple-pay",
    redemptionScope: "Stored value for drinks and app payments"
  }, 1710000000123);
  assert.equal(sentCoffee.xpBalance, initialXpBalance + XP_RULES.sendGift);
  assert.equal(sentCoffee.xpHistory[0].type, "Gift");
  assert.equal(sentCoffee.cashBalance, 20);
  assert.equal(sentCoffee.rewardsBonusBalance, 4.5);
  assert.equal(sentCoffee.walletHistory.length, 1);
  assert.equal(sentCoffee.walletHistory[0].id, "wallet-demo-expired-credit");
  assert.equal(sentCoffee.paymentHistory[0].method, "Apple Pay");

  const nearby = applyXpAction(
    createInitialAppState(),
    "nearby-deals",
    "nearby-deals:2026-06-19",
    1710000000123
  );
  const repeated = applyXpAction(
    nearby,
    "nearby-deals",
    "nearby-deals:2026-06-19",
    1710000000456
  );
  assert.equal(nearby.xpBalance, initialXpBalance + XP_RULES.nearbyDeals);
  assert.equal(repeated, nearby);
});

test("daily check-in awards a seven-day streak bonus once", () => {
  let state = createInitialAppState();
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(2026, 5, 1, 12).getTime();

  for (let index = 0; index < 7; index += 1) {
    state = applyXpAction(
      state,
      "daily-check-in",
      `daily-check-in:${index}`,
      start + index * day
    );
  }

  assert.equal(
    state.xpBalance,
    initialXpBalance + XP_RULES.dailyCheckIn * 7 + XP_RULES.sevenDayStreak
  );
  assert.equal(state.checkInStreak, 7);
  const repeated = applyXpAction(
    state,
    "daily-check-in",
    "daily-check-in:6",
    start + 6 * day
  );
  assert.equal(repeated, state);
});

test("tier thresholds follow the new membership journey", () => {
  assert.equal(getTierByExp(0).name, "Green");
  assert.equal(getTierByExp(999).name, "Green");
  assert.equal(getTierByExp(1000).name, "Gold");
  assert.equal(getTierByExp(4999).name, "Gold");
  assert.equal(getTierByExp(5000).name, "Platinum");
  assert.equal(getTierByExp(14999).name, "Platinum");
  assert.equal(getTierByExp(15000).name, "Diamond");
});

test("expired prepaid order credits rewards bonus once without creating a refund", () => {
  const state = applyCheckout(createInitialAppState(), {
    title: "Iced Americano",
    amount: 3.2,
    itemCount: 1,
    paymentMethod: "Credit Card",
    paymentMethodId: "card",
    points: 32,
    items: [{ ...cartItem, quantity: 1 }]
  }, 1710000000000);
  const order = state.orders[0];

  assert.equal(getOrderCollectionState(order, 1710000001000), "ready");
  assert.equal(getOrderCollectionState(order, order.pickupExpiresAtEpoch + 1), "expired");

  const expired = expireEligibleOrders(state, order.pickupExpiresAtEpoch + 1);
  assert.equal(expired.orders[0].status, "Expired");
  assert.equal(expired.orders[0].pickupCode, undefined);
  assert.equal(expired.orders[0].redemptionToken, undefined);
  assert.equal(expired.cashBalance, 20);
  assert.equal(expired.rewardsBonusBalance, 7.7);
  assert.equal(expired.paymentHistory.some((record) => record.type === "Refund"), false);
  assert.equal(expired.walletHistory[0].type, "Rewards Bonus");
  assert.equal(expired.walletHistory[0].account, "Rewards Bonus");
  assert.equal(expired.walletHistory[0].amount, 3.2);
  assert.equal(getOrderCollectionState(expired.orders[0], order.pickupExpiresAtEpoch + 2), "expired");

  const repeated = expireEligibleOrders(expired, order.pickupExpiresAtEpoch + 2);
  assert.equal(repeated, expired);
});

test("prepaid pickup window is 23 hours and 59 minutes", () => {
  const createdAt = 1710000000000;
  const state = applyCheckout(createInitialAppState(), {
    title: "Iced Americano",
    amount: 3.2,
    itemCount: 1,
    paymentMethod: "Credit Card",
    paymentMethodId: "card",
    points: 32,
    items: [{ ...cartItem, quantity: 1 }]
  }, createdAt);

  assert.equal(state.orders[0].pickupExpiresAtEpoch - createdAt, (24 * 60 - 1) * 60 * 1000);
});

test("new gift records store a concrete expiry timestamp", () => {
  const createdAt = 1710000000123;
  const state = applyGiftPurchase(createInitialAppState(), {
    kind: "voucher",
    title: "Any Drink Voucher",
    recipientName: "Jamie",
    recipientContact: "+1 604 555 0101",
    message: "Good luck.",
    occasion: "Good Luck",
    amount: 6,
    paymentMethod: "Wallet eCard",
    paymentMethodId: "wallet",
    redemptionScope: "Any eligible drink",
    validDays: 14
  }, createdAt);

  assert.equal(state.sentGifts[0].date, "2024-03-09 08:00");
  assert.equal(state.sentGifts[0].expiresAt, "2024-03-23 09:00");
});

test("new benefit usage records include used timestamps", () => {
  const redeemed = redeemPoints(createInitialAppState(), {
    id: "points-coffee-voucher",
    title: "Coffee Voucher",
    pointsCost: 1000,
    validDays: 7,
    rewardType: "Voucher"
  }, 1710000000000);
  const reward = redeemed.redeemedPointRewards[0];
  const used = applyCheckout(redeemed, {
    title: "Iced Americano",
    amount: 3.2,
    payableAmount: 0,
    itemCount: 1,
    paymentMethod: "Wallet eCard",
    paymentMethodId: "wallet",
    points: 0,
    pointsRedeemed: 0,
    benefitsApplied: [{
      id: reward.id,
      type: "Points",
      title: reward.title,
      amount: 3.2
    }],
    items: [{ ...cartItem, quantity: 1 }]
  }, 1710003600000);

  assert.equal(used.usedBenefitIds[0], `Points Reward:${reward.id}`);
  assert.equal(used.usedBenefitRecords[0].key, `Points Reward:${reward.id}`);
  assert.equal(used.usedBenefitRecords[0].usedAt, "2024-03-09 09:00");
  assert.equal(used.redeemedPointRewards[0].status, "Used");
  assert.equal(used.redeemedPointRewards[0].usedAt, "2024-03-09 09:00");
});

test("card expiry input recognizes month and year", () => {
  assert.equal(formatCardExpiryInput("0829"), "08/29");
  assert.equal(formatCardExpiryInput("829"), "08/29");
  assert.equal(formatCardExpiryInput("12/30"), "12/30");
  assert.equal(formatCardExpiryInput("1329"), "13/29");
  assert.equal(formatCardExpiryInput("08", "08/"), "08");
  assert.equal(formatCardExpiryInput("0", "08"), "0");
  assert.equal(formatCardExpiryInput("", "0"), "");
  assert.equal(formatCardExpiryInput("089", "08"), "08/9");
  assert.equal(isValidCardExpiry("08/29"), true);
  assert.equal(isValidCardExpiry("13/29"), false);
  assert.equal(isValidCardExpiry("08/2"), false);
});

test("card number input groups digits in blocks of four", () => {
  assert.equal(formatCardNumberInput("4242424242424242"), "4242 4242 4242 4242");
  assert.equal(formatCardNumberInput("4242 4242-4242 4242"), "4242 4242 4242 4242");
  assert.equal(formatCardNumberInput("4242424"), "4242 424");
  assert.equal(formatCardNumberInput("4242"), "4242");
  assert.equal(formatCardNumberInput("424"), "424");
});

test("tier benefits table keeps the current tier column visible", () => {
  assert.equal(calculateTierColumnOffset(0, 128, 4, 220), 0);
  assert.equal(calculateTierColumnOffset(1, 128, 4, 220), 82);
  assert.equal(calculateTierColumnOffset(2, 128, 4, 220), 210);
  assert.equal(calculateTierColumnOffset(3, 128, 4, 220), 292);
  assert.equal(calculateTierColumnOffset(1, 128, 4, 512), 0);
});
