import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionTile } from "../components/ActionTile";
import { AppCard } from "../components/AppCard";
import { OptionListItem } from "../components/OptionListItem";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { partnerOffers, vouchers } from "../data/appData";
import { colors, spacing, typography } from "../theme";
import { getTierProgress } from "../tiers";
import { getTierVisual } from "../tierVisuals";

type RewardsScreenProps = {
  pointsBalance: number;
  xpBalance: number;
  claimedCouponCount: number;
  redeemedRewardCount: number;
  purchasedPartnerOfferCount: number;
  activeMissionCount: number;
  onOpenMyRewards: () => void;
  onOpenPoints: () => void;
  onOpenMissions: () => void;
  onOpenPartnerOffers: () => void;
  onOpenMemberGrowth: () => void;
  onOpenBenefits: () => void;
  onOpenPartnerBenefits: () => void;
  onOpenHistory: () => void;
};

export function RewardsScreen({
  pointsBalance,
  xpBalance,
  claimedCouponCount,
  redeemedRewardCount,
  purchasedPartnerOfferCount,
  activeMissionCount,
  onOpenMyRewards,
  onOpenPoints,
  onOpenMissions,
  onOpenPartnerOffers,
  onOpenMemberGrowth,
  onOpenBenefits,
  onOpenPartnerBenefits,
  onOpenHistory
}: RewardsScreenProps) {
  const { currentTier, nextTier, expToNextTier, progress } = getTierProgress(xpBalance);
  const visual = getTierVisual(currentTier);
  const activeVoucherCount = vouchers.filter((voucher) => voucher.status === "Active").length;
  const availableOfferCount = partnerOffers.filter((offer) => offer.status === "Active").length;
  const ownedRewardCount = activeVoucherCount + claimedCouponCount + redeemedRewardCount + purchasedPartnerOfferCount;

  return (
    <Screen
      title="Rewards"
      eyebrow="Earn, redeem and use"
      scrollKey="rewards"
      trailing={(
        <TouchableOpacity
          style={styles.headerShortcut}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel="Open rewards history"
          onPress={onOpenHistory}
        >
          <Ionicons name="trophy-outline" size={22} color={colors.blue} />
        </TouchableOpacity>
      )}
    >
      <AppCard style={[styles.hero, { backgroundColor: visual.background, borderColor: visual.border }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroEyebrow, { color: visual.mutedText }]}>Current Tier</Text>
            <Text style={[styles.heroTitle, { color: visual.primaryText }]}>{currentTier.name} Member</Text>
          </View>
          <View style={[styles.pointsPill, { backgroundColor: visual.tileBackground, borderColor: visual.accent }]}>
            <Text style={[styles.pointsPillValue, { color: visual.primaryText }]}>
              {pointsBalance.toLocaleString()}
            </Text>
            <Text style={[styles.pointsPillLabel, { color: visual.accent }]}>Points</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: visual.accent }]} />
        </View>
        <Text style={[styles.heroMeta, { color: visual.mutedText }]}>
          {nextTier ? `${expToNextTier.toLocaleString()} EXP to ${nextTier.name}` : "Top tier unlocked"}
        </Text>
      </AppCard>

      <View style={styles.quickGrid}>
        <ActionTile
          icon="gift-outline"
          label="My Rewards"
          badge={ownedRewardCount}
          tone="success"
          compact
          onPress={onOpenMyRewards}
        />
        <ActionTile
          icon="sparkles-outline"
          label="Points"
          badge={pointsBalance.toLocaleString()}
          tone="info"
          compact
          onPress={onOpenPoints}
        />
        <ActionTile
          icon="flag-outline"
          label="Missions"
          badge={activeMissionCount}
          tone="warning"
          compact
          onPress={onOpenMissions}
        />
        <ActionTile
          icon="storefront-outline"
          label="Offers"
          badge={availableOfferCount}
          tone="neutral"
          compact
          onPress={onOpenPartnerOffers}
        />
      </View>

      <SectionHeader title="Recommended" />
      <AppCard style={styles.listCard}>
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "ticket-outline", tone: "success" }}
          title="Use My Rewards"
          text={`${activeVoucherCount} vouchers · ${claimedCouponCount} coupons`}
          variant="navigate"
          onPress={onOpenMyRewards}
        />
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "sparkles-outline", tone: "info" }}
          title="Redeem Points"
          text="Turn Points into short-term drink rewards"
          variant="navigate"
          onPress={onOpenPoints}
        />
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "flag-outline", tone: "warning" }}
          title="Complete Missions"
          text="Check in, add funds, order or send a gift"
          variant="navigate"
          onPress={onOpenMissions}
        />
      </AppCard>

      <SectionHeader title="Membership" />
      <AppCard style={styles.listCard}>
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "diamond-outline", tone: "info" }}
          title="Member Growth"
          text="Tier progress"
          variant="navigate"
          onPress={onOpenMemberGrowth}
        />
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "list-outline", tone: "neutral" }}
          title="Tier Benefits"
          text="Compare"
          variant="navigate"
          onPress={onOpenBenefits}
        />
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "storefront-outline", tone: "success" }}
          title="Partner Benefits"
          text="Local perks"
          variant="navigate"
          onPress={onOpenPartnerBenefits}
        />
        <OptionListItem
          contained={false}
          density="summary"
          leading={{ type: "icon", icon: "flag-outline", tone: "warning" }}
          title="Missions"
          text="Earn EXP"
          variant="navigate"
          last
          onPress={onOpenMissions}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  heroEyebrow: {
    ...typography.label,
    marginBottom: 5
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800"
  },
  pointsPill: {
    minWidth: 92,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "flex-end"
  },
  pointsPillValue: {
    fontSize: 19,
    fontWeight: "800"
  },
  pointsPillLabel: {
    ...typography.label,
    marginTop: 1
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",
    marginTop: spacing.lg
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  heroMeta: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 9
  },
  quickGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  listCard: {
    paddingVertical: 0,
    paddingHorizontal: spacing.md
  },
  headerShortcut: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.tint,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  }
});
