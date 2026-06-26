import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { AppCard } from "../components/AppCard";
import { FilterPills } from "../components/FilterPills";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { getXpSourceRecordId } from "../recordIds";
import { assetColors, colors } from "../theme";
import { XpRecord } from "../types";

type ExpHistoryScreenProps = {
  onBack: () => void;
  xpBalance: number;
  xpHistory: XpRecord[];
};

type ExpFilter = "All" | XpRecord["type"];
const expFilters: ExpFilter[] = ["All", "Purchase", "Wallet", "Activity", "Referral", "Gift"];

export function ExpHistoryScreen({ onBack, xpBalance, xpHistory }: ExpHistoryScreenProps) {
  const [activeFilter, setActiveFilter] = useState<ExpFilter>("All");
  const totalRecentExp = xpHistory.reduce((sum, record) => sum + record.amount, 0);
  const filteredHistory =
    activeFilter === "All"
      ? xpHistory
      : xpHistory.filter((record) => record.type === activeFilter);

  return (
    <Screen
      title="EXP History"
      eyebrow="Member Growth"
      scrollKey="exp-history"
      onBack={onBack}
      backLabel="Back to Growth"
    >
      <AppCard style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Current EXP</Text>
          <Text style={styles.summaryValue}>{xpBalance.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>Recent earned</Text>
          <Text style={styles.summaryEarned}>+{totalRecentExp} EXP</Text>
        </View>
      </AppCard>

      <FilterPills
        activeValue={activeFilter}
        onChange={setActiveFilter}
        options={expFilters.map((filter) => ({
          value: filter,
          label: filter === "Wallet" ? "Wallet" : filter,
          count:
            filter === "All"
              ? xpHistory.length
              : xpHistory.filter((record) => record.type === filter).length
        }))}
      />

      <AppCard style={styles.historyList}>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="sparkles-outline" size={23} color={colors.muted} />
            <Text style={styles.emptyHistoryTitle}>No matching EXP activity</Text>
            <Text style={styles.emptyHistoryText}>
              Complete eligible actions to build your contribution history.
            </Text>
          </View>
        ) : filteredHistory.map((record, index) => (
          <RecordListItem
            key={record.id}
            leading={{ type: "icon", icon: getHistoryIcon(record.type) }}
            title={record.title}
            datetime={record.date}
            recordId={getXpSourceRecordId(record)}
            secondary={record.description}
            trailing={{ type: "amount", value: `+${record.amount} EXP`, tone: "exp" }}
            last={index === filteredHistory.length - 1}
          />
        ))}
      </AppCard>
    </Screen>
  );
}

function getHistoryIcon(type: XpRecord["type"]): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "Purchase":
      return "bag-check-outline";
    case "Wallet":
      return "wallet-outline";
    case "Activity":
      return "compass-outline";
    case "Referral":
      return "people-outline";
    case "Gift":
      return "gift-outline";
    default:
      return "sparkles-outline";
  }
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4
  },
  summaryRight: {
    alignItems: "flex-end"
  },
  summaryEarned: {
    color: assetColors.exp.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4
  },
  historyList: {
    marginTop: 14,
    paddingVertical: 4
  },
  emptyHistory: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyHistoryTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  emptyHistoryText: {
    maxWidth: 240,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4
  }
});
