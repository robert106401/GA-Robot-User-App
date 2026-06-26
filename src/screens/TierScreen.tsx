import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { InfoListItem } from "../components/InfoListItem";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { getXpSourceRecordId } from "../recordIds";
import { TierCardBackdrop } from "../components/TierCardBackdrop";
import { getTierProgress } from "../tiers";
import { getTierVisual } from "../tierVisuals";
import { colors } from "../theme";
import { XpRecord } from "../types";
import { XP_RULES } from "../xp";

type TierScreenProps = {
  onBack: () => void;
  backLabel?: string;
  onOpenExpHistory: () => void;
  xpBalance: number;
  xpHistory: XpRecord[];
};

export function TierScreen({
  onBack,
  backLabel = "Back to Account",
  onOpenExpHistory,
  xpBalance,
  xpHistory
}: TierScreenProps) {
  const { currentTier, nextTier, expToNextTier, progress } = getTierProgress(xpBalance);
  const visual = getTierVisual(currentTier);
  const recentHistory = xpHistory.slice(0, 3);
  const tierBoostLabel = getTierBoostLabel(currentTier.name);

  return (
    <Screen
      title="Member Growth"
      eyebrow="Tier progress"
      scrollKey="member-growth"
      onBack={onBack}
      backLabel={backLabel}
    >
      <AppCard
        style={[
          styles.heroCard,
          { backgroundColor: visual.background, borderColor: visual.border }
        ]}
      >
        <TierCardBackdrop visual={visual} />
        <View style={styles.heroTop}>
          <View>
            <View style={styles.tierIdentityRow}>
              <View style={[styles.tierCodeBadge, { backgroundColor: visual.tileBackground, borderColor: visual.accent }]}>
                <Text style={[styles.tierCode, { color: visual.accent }]}>{currentTier.code}</Text>
              </View>
              <View>
                <Text style={[styles.tierName, { color: visual.primaryText }]}>{currentTier.name} Member</Text>
                <Text style={[styles.tierTagline, { color: visual.mutedText }]}>
                  {currentTier.tagline}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.multiplierPill, { backgroundColor: visual.tileBackground, borderColor: visual.accent }]}>
            <Text style={[styles.multiplierLabel, { color: visual.accent }]}>
              {tierBoostLabel}
            </Text>
            <Text style={[styles.multiplierText, { color: visual.primaryText }]}>
              {currentTier.pointsPerDollar} Points / $1
            </Text>
          </View>
        </View>
        <View style={styles.progressMetaBlock}>
          <Text style={[styles.expLabel, { color: visual.mutedText }]}>CURRENT EXP</Text>
          <Text style={[styles.expValue, { color: visual.primaryText }]}>
            {xpBalance.toLocaleString()}
          </Text>
          <View style={styles.progressFooterRow}>
            <Text style={[styles.nextTierText, { color: visual.mutedText }]}>
              {nextTier ? `${expToNextTier.toLocaleString()} EXP to ${nextTier.name}` : "Highest tier unlocked"}
            </Text>
            <TouchableOpacity
              style={styles.expHistoryButton}
              activeOpacity={0.7}
              onPress={onOpenExpHistory}
            >
              <Text style={[styles.expHistoryButtonText, { color: visual.accent }]}>
                EXP History
              </Text>
              <Ionicons name="chevron-forward" size={11} color={visual.accent} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: visual.accent
              }
            ]}
          />
        </View>
      </AppCard>

      <AppCard style={styles.assetGuideCard}>
        <AssetGuideItem
          icon="star-outline"
          title="Points"
          text="Redeemable rewards earned from eligible in-app purchases."
        />
        <AssetGuideItem
          icon="trending-up-outline"
          title="EXP"
          text="Growth value that raises your tier. EXP cannot be spent."
        />
        <AssetGuideItem
          icon="gift-outline"
          title="Bonus"
          text="Wallet value from Add Funds offers and expired prepaid orders."
          last
        />
      </AppCard>

      <Text style={styles.sectionTitle}>How EXP Works</Text>
      <AppCard style={styles.xpPrinciplesCard}>
        <XpPrinciple icon="diamond-outline" text="EXP determines membership tier." />
        <XpPrinciple icon="lock-closed-outline" text="EXP cannot be redeemed or spent." />
        <XpPrinciple icon="people-outline" text="EXP recognizes purchase, growth, community and active contribution." last />
      </AppCard>

      <Text style={styles.sectionTitle}>Ways to Earn EXP</Text>
      <AppCard style={styles.earnRulesCard}>
        <EarnRule label="Spend $1 in App" value={`+${XP_RULES.purchasePerDollar}`} />
        <EarnRule label="Add $1 to Wallet eCard" value={`+${XP_RULES.addFundsPerDollar}`} />
        <EarnRule label="Daily Mission: Check In" value={`+${XP_RULES.dailyCheckIn}`} />
        <EarnRule label="Mission Streak: 7-Day Check-In" value={`+${XP_RULES.sevenDayStreak}`} />
        <EarnRule label="Complete a Review" value={`+${XP_RULES.review}`} />
        <EarnRule label="Upload a Photo Review" value={`+${XP_RULES.photoReview}`} />
        <EarnRule label="Mission: Use Nearby Deals" value={`+${XP_RULES.nearbyDeals}`} />
        <EarnRule label="Limited-Time Campaign Mission" value={`+${XP_RULES.campaign}`} />
        <EarnRule label="Invite a Friend to Register" value={`+${XP_RULES.inviteRegistration}`} />
        <EarnRule label="Friend Completes First Order" value={`+${XP_RULES.inviteFirstOrder}`} />
        <EarnRule label="Send a Gift Voucher or eCard" value={`+${XP_RULES.sendGift}`} last />
      </AppCard>

      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyTitleHeading}>Recent EXP Activity</Text>
          <Text style={styles.historySubtitle}>{xpHistory.length} records in history</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={onOpenExpHistory}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.coffee} />
        </TouchableOpacity>
      </View>
      <AppCard style={styles.historyList}>
        {recentHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="sparkles-outline" size={22} color={colors.muted} />
            <Text style={styles.emptyHistoryTitle}>No EXP activity yet</Text>
            <Text style={styles.emptyHistoryText}>
              Purchases, wallet activity and contribution rewards will appear here.
            </Text>
          </View>
        ) : recentHistory.map((record, index) => (
          <RecordListItem
            key={record.id}
            leading={{ type: "icon", icon: getHistoryIcon(record.type) }}
            title={record.title}
            datetime={record.date}
            recordId={getXpSourceRecordId(record)}
            secondary={record.description}
            trailing={{ type: "amount", value: `+${record.amount} EXP`, tone: "exp" }}
            last={index === recentHistory.length - 1}
          />
        ))}
      </AppCard>
    </Screen>
  );
}

function XpPrinciple({
  icon,
  text,
  last = false
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  last?: boolean;
}) {
  return (
    <InfoListItem
      icon={icon}
      title={text}
      last={last}
    />
  );
}

function AssetGuideItem({
  icon,
  title,
  text,
  last = false
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <InfoListItem
      icon={icon}
      title={title}
      text={text}
      last={last}
    />
  );
}

function EarnRule({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <InfoListItem
      icon={getEarnRuleIcon(label)}
      title={label}
      titleLines={2}
      value={`${value} EXP`}
      valueTone="success"
      valueWidth={78}
      last={last}
    />
  );
}

function getEarnRuleIcon(label: string): keyof typeof Ionicons.glyphMap {
  if (label.includes("Spend")) return "bag-check-outline";
  if (label.includes("Wallet")) return "wallet-outline";
  if (label.includes("check")) return "calendar-outline";
  if (label.includes("review")) return "chatbubble-ellipses-outline";
  if (label.includes("Nearby")) return "map-outline";
  if (label.includes("campaign")) return "flag-outline";
  if (label.includes("friend")) return "people-outline";
  if (label.includes("Gift")) return "gift-outline";
  return "sparkles-outline";
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

function getTierBoostLabel(tierName: string) {
  if (tierName === "Green") return "GREEN START";
  if (tierName === "Gold") return "GOLD BOOST";
  if (tierName === "Platinum") return "VIP BOOST";
  return "MAX BOOST";
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    marginBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  backText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600"
  },
  heroCard: {
    overflow: "hidden"
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  tierIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  tierCodeBadge: {
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth
  },
  tierCode: {
    fontSize: 11,
    fontWeight: "800"
  },
  tierName: {
    fontSize: 18,
    fontWeight: "800"
  },
  tierTagline: {
    maxWidth: 210,
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
    marginTop: 2
  },
  multiplierPill: {
    minHeight: 39,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  multiplierLabel: {
    fontSize: 8,
    fontWeight: "800"
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  expLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  expHistoryButton: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2
  },
  expHistoryButtonText: {
    fontSize: 9,
    fontWeight: "700"
  },
  expValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    marginTop: 2
  },
  progressMetaBlock: {
    minHeight: 58,
    marginTop: 8,
    justifyContent: "center"
  },
  progressFooterRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  progressTrack: {
    height: 9,
    marginTop: 7,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 8
  },
  nextTierText: {
    flex: 1,
    fontSize: 8,
    fontWeight: "600"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 10
  },
  assetGuideCard: {
    marginTop: 12,
    paddingVertical: 2
  },
  assetGuideItem: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  assetGuideItemLast: {
    borderBottomWidth: 0
  },
  assetGuideIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  assetGuideCopy: {
    flex: 1
  },
  assetGuideTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  assetGuideText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 3
  },
  xpPrinciplesCard: {
    paddingVertical: 4
  },
  xpPrinciple: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  xpPrincipleText: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17
  },
  earnRulesCard: {
    paddingVertical: 2
  },
  earnRule: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  earnRuleLast: {
    borderBottomWidth: 0
  },
  earnRuleLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600"
  },
  earnRuleValue: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700"
  },
  emptyHistory: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyHistoryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8
  },
  emptyHistoryText: {
    maxWidth: 250,
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 15,
    textAlign: "center",
    marginTop: 4
  },
  historyHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  historyTitleHeading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  historySubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3
  },
  viewAllButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF5DF",
    borderColor: "#F1D9A7",
    borderWidth: StyleSheet.hairlineWidth
  },
  viewAllText: {
    color: colors.coffee,
    fontSize: 12,
    fontWeight: "700"
  },
  historyList: {
    paddingVertical: 4
  },
  historyAmount: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700"
  }
});
