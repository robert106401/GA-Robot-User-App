import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { InlineNotice } from "../components/InlineNotice";
import { ProductListItem } from "../components/ProductListItem";
import { Screen } from "../components/Screen";
import { coupons, memberAssets, skus, vouchers } from "../data/appData";
import { getTierByExp } from "../tiers";
import { calculatePurchasePoints } from "../rewards";
import { colors, radii, spacing, statusColors, typography } from "../theme";
import { AppToastMessage } from "../feedback";
import { BenefitApplied, CartItem, CheckoutResult, RedeemedPointReward, WalletBalances } from "../types";
import { skuDetailVisualAssets } from "../visualAssets";
import { PREPAID_EXPIRY_NOTICE } from "../orderPolicy";
import { calculatePurchaseXp } from "../xp";
import type { CouponAssetTarget } from "./CouponListScreen";

type CheckoutScreenProps = {
  items: CartItem[];
  vmOrder?: CheckoutResult["vmOrder"];
  backLabel?: string;
  walletBalance: number;
  walletBalances: WalletBalances;
  pointsBalance: number;
  pointsInstantRedeemEnabled: boolean;
  claimedCouponIds: string[];
  redeemedPointRewards: RedeemedPointReward[];
  usedBenefitIds: string[];
  onOpenBenefitAsset: (asset: CouponAssetTarget) => void;
  onOpenCashier: (request: CheckoutCashierRequest) => void;
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
  onBack: () => void;
  xpBalance: number;
};

export type CheckoutCashierRequest = Omit<CheckoutResult, "paymentMethod" | "paymentMethodId"> & {
  xpEarned: number;
};

type BenefitCandidate = {
  id: string;
  type: BenefitApplied["type"];
  title: string;
  subtitle: string;
  amount: number;
  pointsCost?: number;
  icon: keyof typeof Ionicons.glyphMap;
  source: string;
  assetTarget?: CouponAssetTarget;
  eligible: boolean;
};

export function CheckoutScreen({
  items,
  vmOrder,
  backLabel = "Back",
  walletBalance,
  walletBalances,
  pointsBalance,
  pointsInstantRedeemEnabled,
  claimedCouponIds,
  redeemedPointRewards,
  usedBenefitIds,
  onOpenBenefitAsset,
  onOpenCashier,
  onShowToast,
  onBack,
  xpBalance
}: CheckoutScreenProps) {
  const [selectedBenefitId, setSelectedBenefitId] = useState<string | null>(null);
  const checkoutItems = items
    .map((item) => {
      const sku = skus.find((skuItem) => skuItem.id === item.skuId);
      return sku ? { item, sku } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const currentTier = getTierByExp(xpBalance);
  const priceEligible = currentTier.memberPriceEligible;
  const totalQuantity = checkoutItems.reduce((sum, entry) => sum + entry.item.quantity, 0);
  const orderSubtotal = checkoutItems.reduce(
    (sum, entry) => sum + parseCurrency(priceEligible ? entry.sku.memberPrice : entry.sku.price) * entry.item.quantity,
    0
  );
  const benefitCandidates = getBenefitCandidates(
    orderSubtotal,
    checkoutItems,
    totalQuantity,
    priceEligible,
    claimedCouponIds,
    redeemedPointRewards,
    usedBenefitIds,
    pointsBalance,
    pointsInstantRedeemEnabled
  );
  const sortedBenefitCandidates = sortBenefitCandidates(benefitCandidates);
  const bestBenefit = sortedBenefitCandidates[0] ?? null;
  const selectedBenefit = selectedBenefitId === "none"
    ? null
    : sortedBenefitCandidates.find((benefit) => benefit.id === selectedBenefitId) ?? bestBenefit;
  const appliedBenefit = selectedBenefit?.amount ?? 0;
  const payable = Math.max(0, orderSubtotal - appliedBenefit);
  const benefitsApplied: BenefitApplied[] = selectedBenefit
    ? [{
        id: selectedBenefit.id,
        type: selectedBenefit.type,
        title: selectedBenefit.title,
        valueApplied: selectedBenefit.amount,
        pointsCost: selectedBenefit.pointsCost
      }]
    : [];
  const pointsRedeemed = selectedBenefit?.type === "Points" ? selectedBenefit.pointsCost ?? 0 : 0;
  const pointsEarned = calculatePurchasePoints(payable, currentTier.pointsPerDollar);
  const xpEarned = calculatePurchaseXp(payable);
  const rewardsBonusUsed = Math.min(walletBalances.rewardsBonus, payable);
  const cashUsed = Math.max(0, payable - rewardsBonusUsed);
  const stockIssues = checkoutItems.filter(({ item, sku }) => item.quantity > sku.stock || sku.stock === 0);
  const hasStockIssue = stockIssues.length > 0;
  const isVmCheckout = Boolean(vmOrder);

  function handleContinueToPay() {
    if (hasStockIssue) {
      onShowToast({
        tone: "warning",
        title: "Inventory changed",
        message: "Please update the cart before paying.",
        icon: "alert-circle-outline"
      });
      return;
    }
    const firstTitle = checkoutItems[0]?.sku.name ?? "Drink order";
    const title = checkoutItems.length > 1 ? `${firstTitle} + ${checkoutItems.length - 1} more` : firstTitle;
    onOpenCashier({
      title,
      amount: payable,
      itemCount: totalQuantity,
      points: pointsEarned,
      benefitsApplied,
      pointsRedeemed,
      items,
      xpEarned,
      vmOrder
    });
  }

  return (
    <Screen
      title={isVmCheckout ? "VM Order Checkout" : "Checkout"}
      eyebrow={vmOrder?.machineName ?? `${totalQuantity} item${totalQuantity > 1 ? "s" : ""} selected`}
      onBack={onBack}
      backLabel={backLabel}
      scrollKey={isVmCheckout ? `vm-checkout-${vmOrder?.orderNumber}` : "checkout"}
      bottomAction={
        <View style={styles.checkoutBottomStack}>
          <View style={styles.checkoutBottomNoticeWrap}>
            {isVmCheckout ? (
              <InlineNotice
                icon="qr-code-outline"
                title="VM Order Benefits"
                meta={vmOrder?.orderNumber}
                text="All eligible app benefits can be applied before paying this VM order."
                tone="info"
                style={styles.bottomPrepaidPolicyNotice}
              />
            ) : (
              <InlineNotice
                icon="time-outline"
                title="Prepaid Order Expiry"
                meta="24-hour pickup"
                text={PREPAID_EXPIRY_NOTICE}
                tone="warning"
                style={styles.bottomPrepaidPolicyNotice}
              />
            )}
          </View>
          <BottomActionBar>
            <BottomActionSummary
              label="Payable After Benefits"
              value={formatCurrency(payable)}
              meta={pointsEarned > 0 || xpEarned > 0 ? `+${pointsEarned} Points · +${xpEarned} EXP` : undefined}
            />
            <BottomActionButton
              label="Continue"
              icon="lock-closed-outline"
              disabled={hasStockIssue}
              onPress={handleContinueToPay}
            />
          </BottomActionBar>
        </View>
      }
    >
        <View style={styles.productList}>
          {checkoutItems.map(({ item, sku }) => (
            <ProductListItem
              key={`${item.skuId}:${item.customizationSummary}`}
              contained
              leading={{
                type: "visual",
                image: skuDetailVisualAssets[sku.id],
                backgroundColor: "transparent",
                icon: "cafe"
              }}
              title={sku.name}
              primary={item.customizationSummary}
              secondary={`Qty ${item.quantity} · ${priceEligible ? sku.memberPrice : sku.price} each`}
              amount={`$${(parseCurrency(priceEligible ? sku.memberPrice : sku.price) * item.quantity).toFixed(2)}`}
            />
          ))}
        </View>

        <Text style={styles.inlineBenefitTitle}>Benefits</Text>
        <InlineBenefitOptions
          benefits={sortedBenefitCandidates}
          selectedBenefitId={selectedBenefit?.id ?? "none"}
          onSelect={setSelectedBenefitId}
          onOpenAsset={onOpenBenefitAsset}
        />

        <AppCard style={styles.summaryCard}>
          <SummaryRow label="Subtotal" value={formatCurrency(orderSubtotal)} />
          <SummaryRow label="Benefits" value={`-${formatCurrency(appliedBenefit)}`} accent={appliedBenefit > 0} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Payable" value={formatCurrency(payable)} strong />
        </AppCard>

        {hasStockIssue ? (
          <AppCard style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="alert-circle-outline" size={21} color={colors.berry} />
              <Text style={styles.warningTitle}>Inventory changed</Text>
            </View>
            <Text style={styles.warningText}>
              {stockIssues.map(({ sku }) => sku.name).join(", ")} cannot be paid now because the VM stock is lower than your selected quantity.
            </Text>
          </AppCard>
        ) : null}

    </Screen>
  );
}

function InlineBenefitOptions({
  benefits,
  selectedBenefitId,
  onSelect,
  onOpenAsset
}: {
  benefits: BenefitCandidate[];
  selectedBenefitId: string;
  onSelect: (benefitId: string) => void;
  onOpenAsset: (asset: CouponAssetTarget) => void;
}) {
  const entries = [
    ...benefits.map((benefit) => ({ id: benefit.id, benefit })),
    { id: "none", benefit: null }
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.inlineBenefitScroll}
    >
      {entries.map(({ id, benefit }) => {
        const selected = selectedBenefitId === id;
        return (
          <View
            key={id}
            style={[styles.inlineBenefitCard, selected && styles.inlineBenefitCardSelected]}
          >
            {benefit?.assetTarget ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`View ${benefit.title} in My Rewards`}
                activeOpacity={0.78}
                style={styles.inlineBenefitInfo}
                onPress={() => onOpenAsset(benefit.assetTarget!)}
              >
                <Ionicons name="information-circle-outline" size={17} color={colors.muted} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected }}
              activeOpacity={0.84}
              style={styles.inlineBenefitPressArea}
              onPress={() => onSelect(id)}
            >
              <View style={styles.inlineBenefitTop}>
                <View style={[styles.inlineBenefitIcon, selected && styles.inlineBenefitIconSelected]}>
                  <Ionicons
                    name={benefit?.icon ?? "remove-circle-outline"}
                    size={16}
                    color={selected ? colors.onDark : benefit ? colors.coffee : colors.muted}
                  />
                </View>
              </View>
              <Text style={styles.inlineBenefitName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
                {benefit?.title ?? "No benefit"}
              </Text>
              <Text style={[styles.inlineBenefitMeta, selected && styles.inlineBenefitMetaSelected]} numberOfLines={1}>
                {benefit ? `Save ${formatCurrency(benefit.amount)}` : "Pay full"}
              </Text>
              {selected ? (
                <View style={styles.inlineBenefitSelectedRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.inlineBenefitSelectedText}>Selected</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

function SummaryRow({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.summaryAccent, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

function getBenefitCandidates(
  orderSubtotal: number,
  checkoutItems: Array<{ item: CartItem; sku: (typeof skus)[number] }>,
  totalQuantity: number,
  priceEligible: boolean,
  claimedCouponIds: string[],
  redeemedPointRewards: RedeemedPointReward[],
  usedBenefitIds: string[],
  pointsBalance: number,
  pointsInstantRedeemEnabled: boolean
): BenefitCandidate[] {
  const safeSubtotal = Math.max(orderSubtotal, 0);
  const itemCount = checkoutItems.length;
  const claimedCoupons = coupons.filter((coupon) =>
    claimedCouponIds.includes(coupon.id) &&
    coupon.status !== "Used" &&
    coupon.status !== "Expired" &&
    !usedBenefitIds.includes(createBenefitUsageKey("Coupon", coupon.id))
  );
  const pointRewardCoupons = redeemedPointRewards
    .filter((reward) =>
      reward.rewardType === "Coupon" &&
      reward.status === "Active" &&
      !usedBenefitIds.includes(createBenefitUsageKey("Points Reward", reward.id))
    )
    .map((reward) => ({
      id: reward.id,
      type: "Points" as const,
      title: reward.title,
      subtitle: "Redeemed from Points Shop",
      amount: Math.min(getPointRewardAmount(reward, safeSubtotal), safeSubtotal),
      icon: "ticket-outline" as const,
      source: "Points Shop",
      assetTarget: { type: "pointReward" as const, id: reward.id },
      eligible: true
    }));
  const bestCoupon = [
    ...claimedCoupons.map((coupon) => ({
      id: coupon.id,
      type: "Coupon" as const,
      title: coupon.offer,
      subtitle: `${claimedCoupons.length} claimed coupons available`,
      amount: Math.min(getCouponAmount(coupon, itemCount, safeSubtotal), safeSubtotal),
      icon: "ticket-outline" as const,
      source: coupon.merchant,
      assetTarget: { type: "coupon" as const, id: coupon.id },
      eligible: true
    })),
    ...pointRewardCoupons
  ].reduce<BenefitCandidate | null>((best, entry) => {
    if (!best || entry.amount > best.amount) {
      return entry;
    }
    return best;
  }, null);
  type VoucherBenefitSource = Pick<BenefitCandidate, "id" | "title" | "subtitle" | "source" | "assetTarget" | "amount">;
  const voucherBenefitSources: VoucherBenefitSource[] = vouchers
    .filter((voucher) => voucher.status === "Active" && !usedBenefitIds.includes(createBenefitUsageKey("Voucher", voucher.id)))
    .map((voucher): VoucherBenefitSource => ({
      id: voucher.id,
      title: voucher.title,
      subtitle: `${voucher.scope} · ${voucher.source}`,
      source: `${voucher.source} · ${voucher.scope}`,
      assetTarget: { type: "voucher" as const, id: voucher.id },
      amount: getVoucherDiscountAmount(voucher, checkoutItems, priceEligible)
    }))
    .concat(redeemedPointRewards
      .filter((reward) =>
        reward.rewardType === "Voucher" &&
        reward.status === "Active" &&
        !usedBenefitIds.includes(createBenefitUsageKey("Points Reward", reward.id))
      )
      .map((reward): VoucherBenefitSource => ({
        id: reward.id,
        title: reward.title,
        subtitle: "Redeemed from Points Shop",
        source: "Points Shop",
        assetTarget: { type: "pointReward" as const, id: reward.id },
        amount: getPointRewardVoucherAmount(reward, checkoutItems, priceEligible, safeSubtotal)
      })))
    .filter((entry) => entry.amount > 0);
  const bestVoucher = voucherBenefitSources.reduce<VoucherBenefitSource | null>((best, entry) => {
    if (!best || entry.amount > best.amount) {
      return entry;
    }
    return best;
  }, null);
  const instantPointsRedemption = pointsInstantRedeemEnabled
    ? calculateInstantPointsRedemption(safeSubtotal, pointsBalance)
    : { amount: 0, pointsCost: 0, payableAfter: safeSubtotal };
  const candidates: BenefitCandidate[] = [
    {
      id: bestCoupon?.id ?? "coupon-default",
      type: "Coupon",
      title: bestCoupon?.title ?? "$2 off coupon",
      subtitle: bestCoupon?.subtitle ?? `${claimedCoupons.length} claimed coupons available`,
      amount: Math.min(bestCoupon?.amount ?? 0, safeSubtotal),
      icon: "ticket-outline",
      source: bestCoupon?.source ?? "Coupons",
      assetTarget: bestCoupon?.assetTarget,
      eligible: Boolean(bestCoupon)
    },
    {
      id: bestVoucher?.id ?? "voucher-any-drink",
      type: "Voucher",
      title: bestVoucher?.title ?? "Any Drink Voucher",
      subtitle: `${voucherBenefitSources.length} active vouchers available`,
      amount: Math.min(bestVoucher?.amount ?? 0, safeSubtotal),
      icon: "gift-outline",
      source: bestVoucher?.source ?? "Gift voucher",
      assetTarget: bestVoucher?.assetTarget,
      eligible: voucherBenefitSources.length > 0
    },
    {
      id: "points-instant-redeem",
      type: "Points",
      title: "Use Points",
      subtitle: instantPointsRedemption.payableAfter > 0
        ? `${instantPointsRedemption.pointsCost.toLocaleString()} Points now · Pay ${formatCurrency(instantPointsRedemption.payableAfter)}`
        : `${instantPointsRedemption.pointsCost.toLocaleString()} Points cover this order`,
      amount: instantPointsRedemption.amount,
      pointsCost: instantPointsRedemption.pointsCost,
      icon: "sparkles-outline",
      source: "Points instant redeem",
      eligible: instantPointsRedemption.pointsCost > 0
    },
    {
      id: "member-benefit",
      type: "Member Benefit",
      title: "Member benefit",
      subtitle: `${memberAssets.benefits} benefits available`,
      amount: Math.min(0.5 * Math.max(1, totalQuantity), safeSubtotal),
      icon: "diamond-outline",
      source: "Membership",
      eligible: memberAssets.benefits > 0
    }
  ];
  return candidates.filter((candidate) => candidate.eligible && candidate.amount > 0);
}

function createBenefitUsageKey(type: "Voucher" | "Coupon" | "Points Reward" | "Member Benefit", id: string) {
  return `${type}:${id}`;
}

function getCouponAmount(coupon: (typeof coupons)[number], itemCount: number, subtotal: number) {
  const dollarMatch = coupon.offer.match(/\$(\d+(?:\.\d+)?)/);
  if (dollarMatch) {
    return Number(dollarMatch[1]);
  }
  const percentMatch = coupon.offer.match(/(\d+)%/);
  if (percentMatch) {
    return subtotal * (Number(percentMatch[1]) / 100);
  }
  return 2 * Math.max(1, itemCount);
}

function getPointRewardAmount(reward: RedeemedPointReward, subtotal: number) {
  const dollarMatch = reward.title.match(/\$(\d+(?:\.\d+)?)/);
  if (dollarMatch) {
    return Number(dollarMatch[1]);
  }
  return Math.min(2, subtotal);
}

function getPointRewardVoucherAmount(
  reward: RedeemedPointReward,
  checkoutItems: Array<{ item: CartItem; sku: (typeof skus)[number] }>,
  priceEligible: boolean,
  subtotal: number
) {
  const title = reward.title.toLowerCase();
  const eligibleSubtotal = checkoutItems.reduce((sum, entry) => {
    if (title.includes("coffee") && entry.sku.category !== "Coffee") {
      return sum;
    }
    if (title.includes("milk tea") && entry.sku.category !== "Milk Tea") {
      return sum;
    }
    return sum + parseCurrency(priceEligible ? entry.sku.memberPrice : entry.sku.price) * entry.item.quantity;
  }, 0);
  return Math.min(eligibleSubtotal || subtotal, subtotal);
}

function calculateInstantPointsRedemption(amount: number, pointsBalance: number) {
  const safeAmount = Math.max(0, roundCurrency(amount));
  const safePoints = Math.max(0, Math.floor(pointsBalance));
  if (safeAmount <= 0 || safePoints <= 0) {
    return { amount: 0, pointsCost: 0, payableAfter: safeAmount };
  }
  const fullCost = Math.ceil(safeAmount * 350);
  if (safePoints >= fullCost) {
    return { amount: safeAmount, pointsCost: fullCost, payableAfter: 0 };
  }
  const redeemableCents = Math.min(Math.floor((safePoints / 350) * 100), Math.round(safeAmount * 100));
  const redeemedAmount = redeemableCents / 100;
  const pointsCost = redeemedAmount > 0 ? Math.min(safePoints, Math.ceil(redeemedAmount * 350)) : 0;
  return {
    amount: redeemedAmount,
    pointsCost,
    payableAfter: roundCurrency(safeAmount - redeemedAmount)
  };
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getVoucherDiscountAmount(
  voucher: (typeof vouchers)[number],
  checkoutItems: Array<{ item: CartItem; sku: (typeof skus)[number] }>,
  priceEligible: boolean
) {
  const eligibleSubtotal = checkoutItems.reduce((sum, entry) => {
    if (!isVoucherEligibleForSku(voucher.scope, entry.sku.category)) {
      return sum;
    }
    return sum + parseCurrency(priceEligible ? entry.sku.memberPrice : entry.sku.price) * entry.item.quantity;
  }, 0);
  return Math.min(voucher.value, eligibleSubtotal);
}

function isVoucherEligibleForSku(scope: (typeof vouchers)[number]["scope"], category: (typeof skus)[number]["category"]) {
  if (scope === "Any drink") {
    return true;
  }
  if (scope === "Coffee only") {
    return category === "Coffee";
  }
  if (scope === "Milk tea only") {
    return category === "Milk Tea";
  }
  return category === "Combo";
}

function sortBenefitCandidates(candidates: BenefitCandidate[]) {
  return [...candidates].sort((first, second) => {
    const amountDiff = second.amount - first.amount;
    if (amountDiff !== 0) {
      return amountDiff;
    }
    return getBenefitTypeRank(first.type) - getBenefitTypeRank(second.type);
  });
}

function getBenefitTypeRank(type: BenefitCandidate["type"]) {
  switch (type) {
    case "Voucher":
      return 0;
    case "Coupon":
      return 1;
    case "Points":
      return 2;
    case "Member Benefit":
      return 3;
    default:
      return 3;
  }
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  productList: {
    gap: 10
  },
  inlineBenefitTitle: {
    color: colors.ink,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.button.fontWeight,
    marginTop: spacing.lg,
    marginBottom: 9
  },
  inlineBenefitScroll: {
    gap: 9,
    paddingRight: spacing.md
  },
  inlineBenefitCard: {
    width: 138,
    minHeight: 104,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative"
  },
  inlineBenefitCardSelected: {
    borderColor: colors.success,
    borderWidth: 1.5,
    backgroundColor: statusColors.success.background
  },
  inlineBenefitTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start"
  },
  inlineBenefitPressArea: {
    minHeight: 104,
    padding: 10,
    borderRadius: radii.md
  },
  inlineBenefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  inlineBenefitIconSelected: {
    backgroundColor: colors.success
  },
  inlineBenefitInfo: {
    position: "absolute",
    right: 8,
    top: 8,
    zIndex: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  inlineBenefitName: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    marginTop: 9
  },
  inlineBenefitMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3
  },
  inlineBenefitMetaSelected: {
    color: colors.success
  },
  inlineBenefitSelectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7
  },
  inlineBenefitSelectedText: {
    color: colors.success,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  summaryCard: {
    marginTop: spacing.md,
    gap: 9
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    fontWeight: typography.label.fontWeight
  },
  summaryValue: {
    color: colors.ink,
    fontSize: typography.body.fontSize,
    fontWeight: typography.button.fontWeight
  },
  summaryAccent: {
    color: colors.success
  },
  summaryStrong: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line
  },
  warningCard: {
    marginTop: spacing.md,
    borderColor: statusColors.danger.border,
    backgroundColor: statusColors.danger.background
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  warningTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  warningText: {
    color: colors.berry,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 7
  },
  checkoutBottomStack: {
    gap: spacing.xs
  },
  checkoutBottomNoticeWrap: {
    marginHorizontal: spacing.md
  },
  bottomPrepaidPolicyNotice: {
    marginBottom: 0
  },
});
