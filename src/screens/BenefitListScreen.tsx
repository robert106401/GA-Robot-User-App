import { useCallback, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { Screen } from "../components/Screen";
import { getTierProgress, tiers } from "../tiers";
import { getTierVisual } from "../tierVisuals";
import { calculateTierColumnOffset } from "../tierTable";
import { colors } from "../theme";

type BenefitListScreenProps = {
  onBack: () => void;
  backLabel?: string;
  xpBalance: number;
};

export function BenefitListScreen({ onBack, backLabel = "Back to Account", xpBalance }: BenefitListScreenProps) {
  const { currentTier } = getTierProgress(xpBalance);
  const visual = getTierVisual(currentTier);
  const benefitRows = getBenefitRows();
  const currentTierIndex = Math.max(
    0,
    tiers.findIndex((tier) => tier.name === currentTier.name)
  );
  const tierColumnWidth = 128;
  const tierScrollRef = useRef<ScrollView>(null);
  const hasPositionedCurrentTier = useRef(false);
  const positionCurrentTier = useCallback((viewportWidth: number) => {
    if (hasPositionedCurrentTier.current || viewportWidth <= 0) {
      return;
    }

    const x = calculateTierColumnOffset(
      currentTierIndex,
      tierColumnWidth,
      tiers.length,
      viewportWidth
    );
    hasPositionedCurrentTier.current = true;
    requestAnimationFrame(() => {
      tierScrollRef.current?.scrollTo({ x, y: 0, animated: false });
    });
  }, [currentTierIndex]);

  return (
    <Screen
      title="Tier Benefits"
      eyebrow="Compare all tiers"
      scrollKey="tier-benefits"
      onBack={onBack}
      backLabel={backLabel}
    >
      <AppCard
        style={[
          styles.summaryCard,
          { backgroundColor: visual.background, borderColor: visual.border }
        ]}
      >
        <View>
          <Text style={[styles.summaryLabel, { color: visual.mutedText }]}>Current tier</Text>
          <Text style={[styles.summaryValue, { color: visual.primaryText }]}>
            {currentTier.code} {currentTier.name} Member
          </Text>
          <Text style={[styles.summaryText, { color: visual.mutedText }]}>
            {currentTier.tagline}
          </Text>
        </View>
        <Ionicons name="diamond-outline" size={28} color={visual.accent} />
      </AppCard>

      <AppCard style={styles.tableCard}>
        <View style={styles.comparisonTable}>
          <View style={styles.fixedColumn}>
            <BenefitNameCell label="Tier" header />
            {benefitRows.map((row) => (
              <BenefitNameCell key={row.label} label={row.label} tall={row.label === "Positioning"} />
            ))}
          </View>
          <ScrollView
            ref={tierScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tierScroll}
            onLayout={(event) => positionCurrentTier(event.nativeEvent.layout.width)}
          >
            <View>
              <View style={styles.tableRow}>
                {tiers.map((tier) => {
                  const isCurrent = tier.name === currentTier.name;

                  return <TierHeaderCell key={tier.code} tier={tier} isCurrent={isCurrent} />;
                })}
              </View>
              {benefitRows.map((row) => (
                <View key={row.label} style={styles.tableRow}>
                  {tiers.map((tier) => {
                    const isCurrent = tier.name === currentTier.name;
                    const value = row.getValue(tier);

                    return (
                      <TierValueCell
                        key={`${row.label}-${tier.code}`}
                        tier={tier}
                        value={value}
                        isCurrent={isCurrent}
                        tall={row.label === "Positioning"}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </AppCard>
    </Screen>
  );
}

function formatTierRange(minExp: number, maxExp: number | null) {
  if (maxExp === null) {
    return `EXP ${minExp.toLocaleString()}+`;
  }
  return `EXP ${minExp.toLocaleString()}-${maxExp.toLocaleString()}`;
}

function BenefitNameCell({ label, header = false, tall = false }: { label: string; header?: boolean; tall?: boolean }) {
  return (
    <View
      style={[
        styles.tableCell,
        styles.benefitNameCell,
        header ? styles.tableHeaderCell : styles.tableBodyCell,
        tall && styles.taglineTableCell
      ]}
    >
      <Text style={header ? styles.tableHeaderText : styles.benefitName}>{label}</Text>
    </View>
  );
}

function TierHeaderCell({ tier, isCurrent }: { tier: (typeof tiers)[number]; isCurrent: boolean }) {
  const tierVisual = getTierVisual(tier);

  return (
    <View
      style={[
        styles.tableCell,
        styles.tierColumn,
        styles.tableHeaderCell,
        isCurrent && {
          backgroundColor: tierVisual.background,
          borderRightColor: tierVisual.border
        }
      ]}
    >
      <Text style={[styles.tierHeaderCode, isCurrent && { color: tierVisual.accent }]} numberOfLines={1}>
        {tier.code}
      </Text>
      <Text style={[styles.tierHeaderName, isCurrent && { color: tierVisual.primaryText }]} numberOfLines={1}>
        {tier.name}
      </Text>
    </View>
  );
}

function TierValueCell({
  tier,
  value,
  isCurrent,
  tall = false
}: {
  tier: (typeof tiers)[number];
  value: string;
  isCurrent: boolean;
  tall?: boolean;
}) {
  const tierVisual = getTierVisual(tier);

  return (
    <View
      style={[
        styles.tableCell,
        styles.tierColumn,
        styles.tableBodyCell,
        tall && styles.taglineTableCell,
        isCurrent && {
          backgroundColor: tierVisual.background,
          borderRightColor: tierVisual.border
        }
      ]}
    >
      {value === "check" ? (
        <Ionicons name="checkmark-circle" size={18} color={isCurrent ? tierVisual.accent : colors.muted} />
      ) : (
        <Text
          style={[
            styles.tableValue,
            tall && styles.taglineTableValue,
            isCurrent && { color: tierVisual.primaryText }
          ]}
          numberOfLines={tall ? 2 : 1}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function getBenefitRows() {
  return [
    {
      label: "Positioning",
      getValue: (tier: (typeof tiers)[number]) => tier.tagline
    },
    {
      label: "EXP",
      getValue: (tier: (typeof tiers)[number]) => formatTierRange(tier.minExp, tier.maxExp).replace("EXP ", "")
    },
    {
      label: "Points earned per $1 spent",
      getValue: (tier: (typeof tiers)[number]) => String(tier.pointsPerDollar)
    },
    {
      label: "Member price",
      getValue: (tier: (typeof tiers)[number]) => (tier.memberPriceEligible ? "check" : "-")
    },
    {
      label: "Member coupon",
      getValue: (tier: (typeof tiers)[number]) => {
        if (tier.name === "Green") return "Occasional";
        if (tier.name === "Gold") return "Regular";
        if (tier.name === "Platinum") return "Frequent";
        return "Priority";
      }
    },
    {
      label: "Birthday rewards",
      getValue: (tier: (typeof tiers)[number]) => {
        if (tier.name === "Green") return "Not included";
        if (tier.name === "Gold") return "Birthday only";
        if (tier.name === "Platinum") return "Birthday week";
        return "Birthday month";
      }
    },
    {
      label: "Priority campaigns",
      getValue: (tier: (typeof tiers)[number]) =>
        tier.name === "Platinum" || tier.name === "Diamond" ? "check" : "-"
    }
  ];
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700"
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5
  },
  tableCard: {
    padding: 0,
    overflow: "hidden"
  },
  comparisonTable: {
    flexDirection: "row"
  },
  fixedColumn: {
    width: 112,
    borderRightColor: colors.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    zIndex: 2
  },
  tierScroll: {
    flex: 1
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRightColor: colors.line,
    borderRightWidth: StyleSheet.hairlineWidth
  },
  tableHeaderCell: {
    height: 62
  },
  tableBodyCell: {
    height: 56
  },
  benefitNameCell: {
    width: "100%",
    alignItems: "flex-start",
    backgroundColor: colors.surface
  },
  tierColumn: {
    width: 128
  },
  tableHeaderText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  tierHeaderCode: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  tierHeaderName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center"
  },
  benefitName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  tableValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  },
  taglineTableCell: {
    height: 68
  },
  taglineTableValue: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center"
  }
});
