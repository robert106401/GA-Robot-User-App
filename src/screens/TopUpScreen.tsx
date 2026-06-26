import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { InlineNotice } from "../components/InlineNotice";
import { OptionTile } from "../components/OptionTile";
import { Screen } from "../components/Screen";
import { addFundsOffers } from "../rewards";
import { colors, radii, spacing, statusColors, typography } from "../theme";
import { TopUpResult, WalletBalances } from "../types";
import { getTierByExp } from "../tiers";
import { getTierVisual } from "../tierVisuals";

type TopUpScreenProps = {
  walletBalance: number;
  walletBalances: WalletBalances;
  xpBalance: number;
  onBack: () => void;
  backLabel?: string;
  onOpenCashier: (result: Omit<TopUpResult, "paymentMethodId">) => void;
};

let persistedTopUpAmount = 30;

export function TopUpScreen({
  walletBalance,
  walletBalances,
  xpBalance,
  onBack,
  backLabel = "Back",
  onOpenCashier
}: TopUpScreenProps) {
  const [draftAmount, setDraftAmount] = useState(persistedTopUpAmount);
  const selectedOffer = addFundsOffers.find((offer) => offer.amount === draftAmount) ?? addFundsOffers[1];
  const tierVisual = getTierVisual(getTierByExp(xpBalance));
  const totalCredit = selectedOffer.amount + selectedOffer.rewardsBonus;
  const newCashBalance = walletBalances.cash + selectedOffer.amount;
  const newRewardsBonusBalance = walletBalances.rewardsBonus + selectedOffer.rewardsBonus;
  const newAvailableBalance = newCashBalance + newRewardsBonusBalance;

  return (
    <Screen
      title="Add Funds"
      eyebrow="Wallet eCard"
      scrollKey="top-up"
      onBack={onBack}
      backLabel={backLabel}
      bottomAction={
        <BottomActionBar>
          <BottomActionSummary
            label="Added to Wallet eCard"
            value={formatCurrency(totalCredit)}
            meta={`${formatCurrency(selectedOffer.amount)} Cash + ${formatCurrency(selectedOffer.rewardsBonus)} Bonus`}
          />
          <BottomActionButton
            label="Continue"
            icon="lock-closed-outline"
            onPress={() => {
              persistedTopUpAmount = selectedOffer.amount;
              onOpenCashier({
                amount: selectedOffer.amount,
                rewardsBonus: selectedOffer.rewardsBonus
              });
            }}
          />
        </BottomActionBar>
      }
    >
      <AppCard style={[styles.balanceCard, { backgroundColor: tierVisual.background, borderColor: tierVisual.border }]}>
        <View>
          <Text style={[styles.balanceLabel, { color: tierVisual.mutedText }]}>Available Balance</Text>
          <Text style={[styles.balanceValue, { color: tierVisual.primaryText }]}>{formatCurrency(walletBalance)}</Text>
          <Text style={[styles.balanceBreakdown, { color: tierVisual.mutedText }]}>
            Cash {formatCurrency(walletBalances.cash)} · Bonus {formatCurrency(walletBalances.rewardsBonus)}
          </Text>
        </View>
      </AppCard>

      <Text style={styles.sectionTitle}>Choose Amount</Text>
      <View style={styles.amountGrid}>
        {addFundsOffers.map((offer) => {
          const active = draftAmount === offer.amount;

          return (
            <OptionTile
              key={offer.amount}
              title={formatWholeCurrency(offer.amount)}
              subtitle={`Get ${formatWholeCurrency(offer.amount + offer.rewardsBonus)}`}
              badge={`+${formatWholeCurrency(offer.rewardsBonus)} Bonus`}
              selected={active}
              accent={colors.success}
              emphasis="large"
              align="center"
              style={[
                styles.amountCard,
                active && styles.amountCardActive
              ]}
              onPress={() => {
                persistedTopUpAmount = offer.amount;
                setDraftAmount(offer.amount);
              }}
            />
          );
        })}
      </View>

      <InlineNotice
        icon="gift-outline"
        title="Bonus Balance"
        meta={`+${formatCurrency(selectedOffer.rewardsBonus)} with this add funds`}
        text="Bonus is app credit for eligible GA Robot purchases and cannot be withdrawn as cash."
        tone="warning"
        style={styles.bonusNotice}
      />

      <AppCard style={styles.totalCard}>
        <View style={styles.totalRows}>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Current Available Balance</Text>
            <Text style={styles.totalRowValue}>{formatCurrency(walletBalance)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Cash Balance</Text>
            <Text style={styles.totalRowValue}>+{formatCurrency(selectedOffer.amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>
              Bonus Balance
            </Text>
            <Text style={styles.totalRowRewards}>+{formatCurrency(selectedOffer.rewardsBonus)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowLast]}>
            <Text style={styles.totalRowLabel}>Available Balance after Add Funds</Text>
            <Text style={styles.totalRowValue}>{formatCurrency(newAvailableBalance)}</Text>
          </View>
        </View>
      </AppCard>

    </Screen>
  );
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatWholeCurrency(value: number) {
  return `$${Math.round(value)}`;
}

const styles = StyleSheet.create({
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.ink
  },
  balanceLabel: {
    color: "#D7CEBD",
    ...typography.body
  },
  balanceValue: {
    color: colors.onDark,
    fontSize: 30,
    fontWeight: typography.button.fontWeight,
    marginTop: spacing.xs
  },
  balanceBreakdown: {
    color: "#D7CEBD",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5
  },
  levelPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.berry
  },
  levelPillText: {
    color: colors.onDark,
    fontSize: 12,
    fontWeight: "700"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.button.fontWeight,
    marginTop: spacing.xxl,
    marginBottom: 10
  },
  walletPaymentOption: {
    backgroundColor: statusColors.success.background,
    borderColor: statusColors.success.border
  },
  amountGrid: {
    flexDirection: "row",
    gap: 6
  },
  amountCard: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    minHeight: 86,
    height: 86,
    paddingHorizontal: 3,
    paddingTop: 10,
    paddingBottom: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  amountCardActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    borderWidth: 2
  },
  amountCardPopular: {
    backgroundColor: statusColors.warning.subtleBackground,
    borderColor: colors.warning,
    borderWidth: 1.5,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
    transform: [{ translateY: -3 }]
  },
  amountValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  amountCredit: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700"
  },
  amountCreditRow: {
    minHeight: 17,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  amountCreditActive: {
    color: colors.onDark
  },
  amountRewardsBadge: {
    position: "absolute",
    top: 6,
    right: 4,
    left: 4,
    minHeight: 19,
    paddingHorizontal: 2,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.success.subtleBackground
  },
  popularBadge: {
    position: "absolute",
    top: -9,
    left: 5,
    right: 5,
    minHeight: 17,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
    borderColor: colors.onDark,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 2
  },
  popularBadgeText: {
    color: colors.onDark,
    fontSize: 7,
    fontWeight: "700"
  },
  amountRewardsBadgeText: {
    color: colors.success,
    fontSize: 8,
    fontWeight: "700"
  },
  amountRewardsBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  amountRewardsBadgeTextActive: {
    color: colors.onDark
  },
  amountValueActive: {
    color: colors.onDark
  },
  customAmountLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5
  },
  customAmountHint: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3
  },
  customAmountLabelActive: {
    color: colors.success
  },
  customAmountHintActive: {
    color: colors.success
  },
  customAmountCard: {
    marginTop: 10,
    gap: 12
  },
  customAmountHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  customAmountTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  customAmountDescription: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3
  },
  customPointsPreview: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700"
  },
  customPointsPreviewMuted: {
    color: colors.berry
  },
  customAmountControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  amountStepper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  customInputWrap: {
    flex: 1,
    maxWidth: 150,
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.success,
    borderWidth: 1.5
  },
  customInputWrapInvalid: {
    borderColor: colors.berry
  },
  currencyPrefix: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "700"
  },
  customInput: {
    minWidth: 64,
    color: colors.ink,
    fontSize: 23,
    fontWeight: "700",
    paddingVertical: 0
  },
  customAmountError: {
    color: colors.berry,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center"
  },
  paymentOptionActive: {
    backgroundColor: "#EEF6F0",
    borderColor: colors.success
  },
  totalCard: {
    marginTop: 10,
    paddingVertical: 2
  },
  zeroFeeBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: statusColors.success.subtleBackground
  },
  zeroFeeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700"
  },
  totalRows: {},
  totalRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  totalRowLast: {
    borderBottomWidth: 0
  },
  totalRowLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  totalRowValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  totalRowRewards: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700"
  },
  message: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center"
  },
  bonusNotice: {
    marginTop: spacing.md
  },
});
