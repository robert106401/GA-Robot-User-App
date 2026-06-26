import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { AppCard } from "../components/AppCard";
import { FilterPills } from "../components/FilterPills";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { transactionHistory } from "../data/appData";
import { colors, statusColors } from "../theme";

type TransactionHistoryScreenProps = {
  onBack: () => void;
};

type TransactionFilter = "All" | "Wallet eCard" | "Apple Pay" | "Google Pay" | "PayPal" | "Credit Card";

const transactionFilters: TransactionFilter[] = ["All", "Wallet eCard", "Apple Pay", "Google Pay", "PayPal", "Credit Card"];

export function TransactionHistoryScreen({ onBack }: TransactionHistoryScreenProps) {
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("All");
  const filteredTransactions =
    activeFilter === "All"
      ? transactionHistory
      : transactionHistory.filter((transaction) => transaction.method === activeFilter);

  return (
    <Screen
      title="Payment History"
      eyebrow="All payment activity"
      scrollKey="transaction-history"
      onBack={onBack}
      backLabel="Back to Me"
    >
      <AppCard style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="receipt-outline" size={19} color={colors.onDark} />
        </View>
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle}>Payments across every method</Text>
          <Text style={styles.infoText}>Icons show payment methods. Amount color highlights orders, added funds and refunds.</Text>
        </View>
      </AppCard>

      <FilterPills
        activeValue={activeFilter}
        onChange={setActiveFilter}
        options={transactionFilters.map((filter) => ({
          value: filter,
          icon: getMethodIcon(filter),
          count:
            filter === "All"
              ? transactionHistory.length
              : transactionHistory.filter((transaction) => transaction.method === filter).length
        }))}
      />

      <AppCard style={styles.transactionList}>
        {filteredTransactions.map((transaction, index) => {
          const isCredit = transaction.amount > 0;
          const amountColor = getTransactionAmountColor(transaction.type);
          const statusTone = getStatusTone(transaction.status);

          return (
            <RecordListItem
              key={transaction.id}
              leading={{ type: "icon", icon: getMethodIcon(transaction.method) }}
              title={formatFundingCopy(transaction.title)}
              datetime={transaction.date}
              recordId={transaction.transactionId}
              secondary={formatFundingCopy(transaction.description)}
              last={index === filteredTransactions.length - 1}
              titleAccessory={
                  <View style={[styles.statusPill, { backgroundColor: statusTone.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusTone.color }]}>
                      {transaction.status}
                    </Text>
                  </View>
              }
              trailing={{
                type: "custom",
                node: (
                  <>
                    <Text style={[styles.transactionAmount, { color: amountColor }]}>
                      {isCredit ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                    {transaction.type === "Top Up" ? <Text style={styles.amountCaption}>Wallet added</Text> : null}
                  </>
                )
              }}
            />
          );
        })}
      </AppCard>
    </Screen>
  );
}

function getMethodIcon(method: string): keyof typeof Ionicons.glyphMap {
  switch (method) {
    case "Wallet eCard":
      return "wallet-outline";
    case "Apple Pay":
      return "logo-apple";
    case "Google Pay":
      return "logo-google";
    case "PayPal":
      return "logo-paypal";
    case "Credit Card":
      return "card-outline";
    default:
      return "receipt-outline";
  }
}

function getTransactionAmountColor(type: string) {
  switch (type) {
    case "Top Up":
      return colors.blue;
    case "Refund":
      return colors.success;
    case "Order":
      return colors.berry;
    default:
      return colors.ink;
  }
}

function formatFundingCopy(value: string) {
  return value
    .replaceAll("Wallet Top Up", "Add Funds")
    .replaceAll("Top Up Bonus", "Add Funds Bonus")
    .replaceAll("Rewards Bonus", "Bonus")
    .replaceAll("Cash Top Up", "Funds Added")
    .replaceAll("Top Up", "Add Funds");
}

function getStatusTone(status: string) {
  switch (status) {
    case "Refunded":
      return { color: statusColors.success.text, backgroundColor: statusColors.success.subtleBackground };
    case "Pending":
      return { color: statusColors.warning.text, backgroundColor: statusColors.warning.subtleBackground };
    case "Failed":
      return { color: statusColors.danger.text, backgroundColor: statusColors.danger.background };
    default:
      return { color: statusColors.neutral.text, backgroundColor: statusColors.neutral.background };
  }
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: statusColors.success.background,
    borderColor: statusColors.success.border
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success
  },
  infoCopy: {
    flex: 1
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  infoText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 4
  },
  transactionList: {
    marginTop: 14,
    paddingVertical: 4
  },
  statusPill: {
    minHeight: 21,
    paddingHorizontal: 7,
    borderRadius: 8,
    justifyContent: "center"
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700"
  },
  topUpBreakdown: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  pointsText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700"
  },
  amountCaption: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "600"
  }
});
