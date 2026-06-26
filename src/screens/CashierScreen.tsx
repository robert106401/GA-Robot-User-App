import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { InlineNotice } from "../components/InlineNotice";
import { OptionListItem } from "../components/OptionListItem";
import { Screen } from "../components/Screen";
import { PaymentMethod, PaymentMethodId, SavedPaymentCard } from "../paymentMethods";
import { colors, spacing, typography } from "../theme";
import { BenefitApplied } from "../types";

export type CashierPaymentOutcome = {
  status?: "success" | "error";
  title: string;
  message: string;
  meta?: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
  onComplete: () => void;
};

type CashierScreenProps = {
  title: string;
  eyebrow: string;
  amount: number;
  summaryTitle: string;
  summaryText: string;
  benefitsApplied?: BenefitApplied[];
  selectedPayment: PaymentMethodId;
  availableMethods: PaymentMethod[];
  savedCards: SavedPaymentCard[];
  selectedCardId: string;
  walletBalance: number;
  walletBalanceLabel?: string;
  paymentNoticeText?: string;
  lowBalanceNoticeText?: string;
  onBack: () => void;
  onOpenPaymentMethod: () => void;
  onSelectPayment: (methodId: PaymentMethodId) => void;
  onSelectCard: (cardId: string) => void;
  onAddFunds: () => void;
  onPay: () => CashierPaymentOutcome | null;
};

export function CashierScreen({
  title,
  eyebrow,
  amount,
  summaryTitle,
  summaryText,
  benefitsApplied: _benefitsApplied = [],
  selectedPayment,
  availableMethods,
  savedCards,
  selectedCardId,
  walletBalance,
  walletBalanceLabel = "Available Balance",
  paymentNoticeText,
  lowBalanceNoticeText,
  onBack,
  onOpenPaymentMethod,
  onSelectPayment,
  onSelectCard,
  onAddFunds,
  onPay
}: CashierScreenProps) {
  const isWallet = selectedPayment === "wallet";
  const isNoPaymentRequired = amount <= 0;
  const noPaymentActionLabel = title === "Gift payment"
    ? "Confirm Gift"
    : title.startsWith("Partner")
      ? "Confirm Purchase"
      : title === "VM order"
        ? "Confirm Payment"
      : "Confirm Order";
  const noPaymentNoticeText = title === "Gift payment"
    ? "Your benefits cover the full amount. Confirm to send the gift."
    : title.startsWith("Partner")
      ? "Your benefits cover the full amount. Confirm to add this partner benefit."
      : title === "VM order"
        ? "Your benefits cover the full amount. Confirm to pay this VM order."
      : "Your benefits cover the full amount. Confirm to create the prepaid order.";
  const walletCoversAmount = walletBalance >= amount;
  const canPay = isNoPaymentRequired || !isWallet || walletCoversAmount;
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "complete">("idle");
  const [paymentOutcome, setPaymentOutcome] = useState<CashierPaymentOutcome | null>(null);
  const isPaymentError = paymentOutcome?.status === "error";

  function handlePay() {
    if (!canPay) {
      onAddFunds();
      return;
    }
    setPaymentState("processing");
    const outcome = onPay();
    if (!outcome) {
      setPaymentState("idle");
      return;
    }
    setPaymentOutcome(outcome);
    setPaymentState("complete");
  }

  if (paymentState === "processing" || paymentState === "complete") {
    return (
      <Screen
        title="Cashier"
        eyebrow={paymentState === "complete" ? (isPaymentError ? "Payment Failed" : "Payment Complete") : "Processing Payment"}
        scrollKey={`cashier-${paymentState}`}
        onBack={paymentState === "complete" ? undefined : onBack}
        backLabel="Back"
        fixedHeader
        bottomAction={
          paymentState === "complete" && paymentOutcome ? (
            <BottomActionBar>
              <BottomActionSummary label={isPaymentError || amount <= 0 ? "Total" : "Paid"} value={formatCurrency(amount)} />
              <BottomActionButton
                label={isPaymentError ? "Try Again" : "Continue"}
                icon={isPaymentError ? "refresh-outline" : "arrow-forward"}
                onPress={() => {
                  if (isPaymentError) {
                    setPaymentOutcome(null);
                    setPaymentState("idle");
                    return;
                  }
                  paymentOutcome.onComplete();
                }}
              />
            </BottomActionBar>
          ) : undefined
        }
      >
        <View style={styles.paymentStateCard}>
          <View style={[
            styles.paymentStateIcon,
            paymentState === "complete" && !isPaymentError && styles.paymentStateIconSuccess,
            paymentState === "complete" && isPaymentError && styles.paymentStateIconError
          ]}>
            {paymentState === "complete" ? (
              <Ionicons name={isPaymentError ? "close" : "checkmark"} size={30} color={colors.onDark} />
            ) : (
              <ActivityIndicator size="small" color={colors.blue} />
            )}
          </View>
          <Text style={styles.paymentStateTitle}>
            {paymentState === "complete" ? paymentOutcome?.title ?? "Payment Successful" : "Processing Payment"}
          </Text>
          <Text style={styles.paymentStateText}>
            {paymentState === "complete"
              ? paymentOutcome?.message ?? "Your payment has been confirmed."
              : "Confirming the amount and payment method."}
          </Text>
          {paymentState === "complete" && paymentOutcome?.meta ? (
            <Text style={[styles.paymentStateMeta, isPaymentError && styles.paymentStateMetaError]}>{paymentOutcome.meta}</Text>
          ) : null}
          {paymentState === "complete" && paymentOutcome?.details?.length ? (
            <View style={styles.paymentReceipt}>
              {paymentOutcome.details.map((detail) => (
                <View key={detail.label} style={styles.paymentReceiptRow}>
                  <Text style={styles.paymentReceiptLabel}>{detail.label}</Text>
                  <Text style={styles.paymentReceiptValue}>{detail.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Cashier"
      eyebrow={eyebrow}
      scrollKey={`cashier-${title}`}
      onBack={onBack}
      backLabel="Back"
      fixedHeader
      bottomAction={
        <View style={styles.bottomActionWrap}>
          {isWallet && !walletCoversAmount ? (
            <View style={styles.bottomNoticeWrap}>
              <InlineNotice
                icon="wallet-outline"
                title="Wallet eCard Balance Is Low"
                meta={`${walletBalanceLabel} ${formatCurrency(walletBalance)}`}
                text={lowBalanceNoticeText ?? "Add funds or choose another payment method to complete this payment."}
                tone="warning"
              />
            </View>
          ) : (
            <View style={styles.bottomNoticeWrap}>
              <InlineNotice
                icon={isNoPaymentRequired ? "checkmark-circle-outline" : "shield-checkmark-outline"}
                title={isNoPaymentRequired ? "No Payment Required" : "Secure Payment"}
                meta={isNoPaymentRequired ? "Covered by Benefits" : "One Confirmation"}
                text={isNoPaymentRequired ? noPaymentNoticeText : paymentNoticeText ?? "Review the amount and payment method here before confirming."}
                tone="info"
              />
            </View>
          )}
          <BottomActionBar style={styles.cashierActionBar}>
            <BottomActionSummary label="Total" value={formatCurrency(amount)} />
            <BottomActionButton
              label={isNoPaymentRequired ? noPaymentActionLabel : canPay ? "Pay Now" : "Add Funds"}
              icon={canPay ? "lock-closed-outline" : "wallet-outline"}
              onPress={handlePay}
            />
          </BottomActionBar>
        </View>
      }
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="receipt-outline" size={20} color={colors.blue} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryLabel}>{title}</Text>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
        </View>
        <Text style={styles.summaryAmount}>{formatCurrency(amount)}</Text>
      </View>

      {isNoPaymentRequired ? null : (
        <>
          <Text style={styles.sectionTitle}>Pay With</Text>
          <View style={styles.paymentList}>
            {availableMethods.filter((method) => method.id !== "card").map((method) => {
              const methodIsWallet = method.id === "wallet";
              const methodDisabled = methodIsWallet && !walletCoversAmount;
              return (
                <OptionListItem
                  key={method.id}
                  variant="select"
                  density="summary"
                  selected={selectedPayment === method.id}
                  disabled={methodDisabled}
                  leading={{
                    type: "icon",
                    icon: method.icon,
                    tone: methodIsWallet ? "success" : "neutral",
                    color: methodIsWallet ? colors.onDark : colors.ink,
                    backgroundColor: methodIsWallet ? colors.success : undefined
                  }}
                  title={method.title}
                  text={
                    methodIsWallet
                      ? `${walletBalanceLabel} ${formatCurrency(walletBalance)}${walletCoversAmount ? "" : " · Add Funds needed"}`
                      : method.subtitle
                  }
                  onPress={() => onSelectPayment(method.id)}
                />
              );
            })}
            {savedCards.map((card) => (
              <OptionListItem
                key={card.id}
                variant="select"
                density="summary"
                selected={selectedPayment === "card" && selectedCardId === card.id}
                leading={{
                  type: "icon",
                  icon: "card-outline",
                  tone: "neutral",
                  color: colors.ink
                }}
                title={`${card.brand} · •••• ${card.last4}`}
                text={`Expires ${card.expiry}`}
                onPress={() => onSelectCard(card.id)}
              />
            ))}
            <OptionListItem
              variant="navigate"
              density="summary"
              leading={{ type: "icon", icon: "add-circle-outline", tone: "neutral", color: colors.ink }}
              title="Add Payment Method"
              text="Credit / debit card or PayPal"
              onPress={onOpenPaymentMethod}
            />
          </View>
        </>
      )}
      <View style={styles.bottomNoticeContentSpacer} />
    </Screen>
  );
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0
  },
  summaryLabel: {
    color: colors.blue,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700"
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 3
  },
  summaryText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    marginTop: 3
  },
  summaryAmount: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    fontVariant: ["tabular-nums"]
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  paymentList: {
    gap: 10
  },
  bottomActionWrap: {
    marginBottom: spacing.md
  },
  bottomNoticeWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm
  },
  cashierActionBar: {
    marginBottom: 0
  },
  bottomNoticeContentSpacer: {
    height: 72
  },
  paymentStateCard: {
    minHeight: 300,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  paymentStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  paymentStateIconSuccess: {
    backgroundColor: colors.success
  },
  paymentStateIconError: {
    backgroundColor: colors.berry
  },
  paymentStateTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    marginTop: spacing.lg,
    textAlign: "center"
  },
  paymentStateText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  paymentStateMeta: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center"
  },
  paymentStateMetaError: {
    color: colors.berry
  },
  paymentReceipt: {
    width: "100%",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm
  },
  paymentReceiptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  paymentReceiptLabel: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600"
  },
  paymentReceiptValue: {
    flexShrink: 1,
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "right",
    fontVariant: ["tabular-nums"]
  }
});
