import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { colors, radii, statusColors } from "../theme";
import { getTierByExp } from "../tiers";
import { getTierVisual } from "../tierVisuals";
import { XP_RULES } from "../xp";

type MissionStatus = "Ready" | "Completed";
type MissionPeriod = "Daily" | "Weekly" | "Campaign" | "Milestone" | "Repeatable";

type Mission = {
  id: string;
  title: string;
  tag: string;
  period: MissionPeriod;
  description: string;
  reward: string;
  progressLabel: string;
  progressValue: number;
  expiry: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "daily" | "campaign" | "growth";
  status: MissionStatus;
  action: string;
  onPress?: () => void;
};

type MissionsScreenProps = {
  onBack: () => void;
  backLabel?: string;
  checkInStreak: number;
  checkedInToday: boolean;
  addFundsTotal: number;
  addFundsXpTotal: number;
  appPurchaseCount: number;
  appPurchaseXpTotal: number;
  sentGiftCount: number;
  xpBalance: number;
  onDailyCheckIn: () => void;
  onOpenTopUp: () => void;
  onOpenOrder: () => void;
  onOpenGift: () => void;
};

export function MissionsScreen({
  onBack,
  backLabel = "Back",
  checkInStreak,
  checkedInToday,
  addFundsTotal,
  addFundsXpTotal,
  appPurchaseCount,
  appPurchaseXpTotal,
  sentGiftCount,
  xpBalance,
  onDailyCheckIn,
  onOpenTopUp,
  onOpenOrder,
  onOpenGift
}: MissionsScreenProps) {
  const tierVisual = getTierVisual(getTierByExp(xpBalance));
  const missions = getMissions({
    checkedInToday,
    checkInStreak,
    addFundsTotal,
    addFundsXpTotal,
    appPurchaseCount,
    appPurchaseXpTotal,
    sentGiftCount,
    onDailyCheckIn,
    onOpenTopUp,
    onOpenOrder,
    onOpenGift
  });
  const activeMissions = missions.filter((mission) => mission.status !== "Completed");
  const completedMissions = missions.filter((mission) => mission.status === "Completed");

  return (
    <Screen
      title="Missions"
      eyebrow="Earn EXP"
      scrollKey="missions"
      onBack={onBack}
      backLabel={backLabel}
    >
      <AppCard
        style={[
          styles.summaryCard,
          { backgroundColor: tierVisual.background, borderColor: tierVisual.border }
        ]}
      >
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: tierVisual.tileBackground }]}>
            <Ionicons name="flag-outline" size={22} color={tierVisual.accent} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryEyebrow, { color: tierVisual.mutedText }]}>Earn EXP</Text>
            <Text style={[styles.summaryTitle, { color: tierVisual.primaryText }]}>
              {activeMissions.length ? `${activeMissions.length} missions ready` : "All missions completed"}
            </Text>
            <Text style={[styles.summaryText, { color: tierVisual.mutedText }]}>
              Complete app actions to grow your membership tier.
            </Text>
          </View>
        </View>
        <View style={styles.summaryStats}>
          <View style={[styles.summaryStatTile, { backgroundColor: tierVisual.tileBackground }]}>
            <Text style={[styles.summaryStatValue, { color: tierVisual.primaryText }]}>{activeMissions.length}</Text>
            <Text style={[styles.summaryStatLabel, { color: tierVisual.mutedText }]}>Open</Text>
          </View>
          <View style={[styles.summaryStatTile, { backgroundColor: tierVisual.tileBackground }]}>
            <Text style={[styles.summaryStatValue, { color: tierVisual.primaryText }]}>{completedMissions.length}/{missions.length}</Text>
            <Text style={[styles.summaryStatLabel, { color: tierVisual.mutedText }]}>Done</Text>
          </View>
          <View style={[styles.summaryStatTile, { backgroundColor: tierVisual.tileBackground }]}>
            <Text style={[styles.summaryStatValue, { color: tierVisual.primaryText }]}>
              {checkInStreak} day{checkInStreak === 1 ? "" : "s"}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: tierVisual.mutedText }]}>Check-in streak</Text>
          </View>
        </View>
      </AppCard>

      <MissionSectionHeader title="Active" meta={`${activeMissions.length} open`} />
      {activeMissions.length ? (
        <AppCard style={styles.missionListCard}>
          {activeMissions.map((mission, index) => (
            <MissionRow
              key={mission.id}
              mission={mission}
              last={index === activeMissions.length - 1}
            />
          ))}
        </AppCard>
      ) : (
        <AppCard style={styles.emptyActiveCard}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <View style={styles.emptyActiveCopy}>
            <Text style={styles.emptyActiveTitle}>You're caught up</Text>
            <Text style={styles.emptyActiveText}>Completed missions are saved below so the progress still feels earned.</Text>
          </View>
        </AppCard>
      )}

      {completedMissions.length ? (
        <>
          <MissionSectionHeader title="Completed" meta="Archived soon" />
          <AppCard style={styles.missionListCard}>
            {completedMissions.map((mission, index) => (
              <MissionRow
                key={mission.id}
                mission={mission}
                compact
                last={index === completedMissions.length - 1}
              />
            ))}
          </AppCard>
        </>
      ) : null}
    </Screen>
  );
}

function MissionSectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionMeta}>{meta}</Text>
    </View>
  );
}

function MissionRow({ mission, compact = false, last = false }: { mission: Mission; compact?: boolean; last?: boolean }) {
  const tone = getMissionTone(mission.tone);
  const completed = mission.status === "Completed";
  const actionable = Boolean(mission.onPress) && !completed;

  return (
    <RecordListItem
      leading={{ type: "icon", icon: completed ? "checkmark" : mission.icon }}
      title={mission.title}
      primary={compact ? undefined : mission.description}
      secondary={`${mission.tag} · ${mission.period}`}
      datetime={mission.expiry}
      recordId={formatMissionRecordId(mission)}
      last={last}
      style={compact ? styles.completedMissionRow : undefined}
      detail={
        <View style={styles.rowDetail}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{mission.progressLabel}</Text>
            <View style={[styles.statusPill, completed && styles.statusPillCompleted]}>
              <Text style={[styles.statusPillText, completed && styles.statusPillTextCompleted]}>{mission.status}</Text>
            </View>
          </View>
          {!compact ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${mission.progressValue * 100}%`, backgroundColor: completed ? colors.success : tone.icon }]} />
            </View>
          ) : null}
        </View>
      }
      trailing={{
        type: "custom",
        node: (
          <View style={styles.missionTrailing}>
            <View style={[styles.rewardBadge, completed && styles.rewardBadgeCompleted]}>
              <Text style={[styles.rewardBadgeText, completed && styles.rewardBadgeTextCompleted]}>{mission.reward}</Text>
            </View>
            {!completed ? (
              <TouchableOpacity
                style={styles.rowAction}
                activeOpacity={actionable ? 0.84 : 1}
                disabled={!actionable}
                onPress={mission.onPress}
              >
                <Text style={[styles.rowActionText, { color: tone.icon }]} numberOfLines={1}>{mission.action}</Text>
                <Ionicons name="chevron-forward" size={15} color={tone.icon} />
              </TouchableOpacity>
            ) : null}
          </View>
        )
      }}
    />
  );
}

function formatMissionRecordId(mission: Mission) {
  return `MSN-${mission.id.toUpperCase().replaceAll("-", "-")}`;
}

function getMissions({
  checkedInToday,
  checkInStreak,
  addFundsTotal,
  addFundsXpTotal,
  appPurchaseCount,
  appPurchaseXpTotal,
  sentGiftCount,
  onDailyCheckIn,
  onOpenTopUp,
  onOpenOrder,
  onOpenGift
}: {
  checkedInToday: boolean;
  checkInStreak: number;
  addFundsTotal: number;
  addFundsXpTotal: number;
  appPurchaseCount: number;
  appPurchaseXpTotal: number;
  sentGiftCount: number;
  onDailyCheckIn: () => void;
  onOpenTopUp: () => void;
  onOpenOrder: () => void;
  onOpenGift: () => void;
}): Mission[] {
  return [
    {
      id: "daily-check-in",
      title: "Check In Today",
      tag: "DAILY",
      period: "Daily",
      description: `Keep your daily habit alive. Current streak: ${checkInStreak} days.`,
      reward: `+${XP_RULES.dailyCheckIn} EXP`,
      progressLabel: checkedInToday ? "Checked in" : "0/1 today",
      progressValue: checkedInToday ? 1 : 0,
      expiry: "Today",
      icon: "flag-outline",
      tone: "daily",
      status: checkedInToday ? "Completed" : "Ready",
      action: `Check In +${XP_RULES.dailyCheckIn}`,
      onPress: onDailyCheckIn
    },
    {
      id: "add-funds",
      title: "Add Funds to Wallet eCard",
      tag: "WALLET",
      period: "Milestone",
      description: "Add funds through the app and receive the selected Bonus.",
      reward: addFundsXpTotal > 0 ? `+${addFundsXpTotal} EXP` : `+${XP_RULES.addFundsPerDollar} EXP / $1`,
      progressLabel: addFundsTotal > 0 ? `$${addFundsTotal.toFixed(0)} added` : "$0 added",
      progressValue: addFundsTotal > 0 ? 1 : 0,
      expiry: "Always on",
      icon: "wallet-outline",
      tone: "growth",
      status: addFundsTotal > 0 ? "Completed" : "Ready",
      action: "Add Funds",
      onPress: onOpenTopUp
    },
    {
      id: "buy-any-drink",
      title: "Buy Any Drink in App",
      tag: "PURCHASE",
      period: "Milestone",
      description: "Place a prepaid order for any coffee, milk tea, tea, combo or functional drink.",
      reward: appPurchaseXpTotal > 0 ? `+${appPurchaseXpTotal} EXP` : `+${XP_RULES.purchasePerDollar} EXP / $1`,
      progressLabel: appPurchaseCount > 0 ? "App order completed" : "0/1 order",
      progressValue: appPurchaseCount > 0 ? 1 : 0,
      expiry: "Any time",
      icon: "cafe-outline",
      tone: "daily",
      status: appPurchaseCount > 0 ? "Completed" : "Ready",
      action: "Browse Drinks",
      onPress: onOpenOrder
    },
    {
      id: "send-free-voucher",
      title: "Send a Free Drink Voucher",
      tag: "GIFT",
      period: "Campaign",
      description: "Send a friend a voucher they can redeem for any eligible coffee or milk tea.",
      reward: sentGiftCount > 0 ? `+${sentGiftCount * XP_RULES.sendGift} EXP` : `+${XP_RULES.sendGift} EXP`,
      progressLabel: sentGiftCount > 0 ? `${sentGiftCount} gift${sentGiftCount === 1 ? "" : "s"} sent` : "0/1 gift",
      progressValue: sentGiftCount > 0 ? 1 : 0,
      expiry: "Ends Jul 21",
      icon: "ticket-outline",
      tone: "campaign",
      status: sentGiftCount > 0 ? "Completed" : "Ready",
      action: "Send Voucher",
      onPress: onOpenGift
    }
  ];
}

function getMissionTone(tone: Mission["tone"]) {
  if (tone === "campaign") {
    return {
      background: "#FFF6E8",
      border: "#F2C477",
      iconBackground: "#FFE5B7",
      icon: colors.warning
    };
  }
  if (tone === "growth") {
    return {
      background: statusColors.info.background,
      border: statusColors.info.border,
      iconBackground: statusColors.info.subtleBackground,
      icon: colors.blue
    };
  }
  return {
    background: statusColors.success.background,
    border: statusColors.success.border,
    iconBackground: statusColors.success.subtleBackground,
    icon: colors.success
  };
}

const styles = StyleSheet.create({
  summaryCard: {
    minHeight: 150,
    gap: 12,
    borderRadius: radii.md
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center"
  },
  summaryCopy: {
    flex: 1
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: "700"
  },
  summaryTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    marginTop: 2
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    marginTop: 3
  },
  summaryStats: {
    flexDirection: "row",
    gap: 8
  },
  summaryStatTile: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md
  },
  summaryStatValue: {
    fontSize: 15,
    fontWeight: "700"
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  missionListCard: {
    paddingVertical: 0
  },
  emptyActiveCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: statusColors.success.background,
    borderColor: statusColors.success.border
  },
  emptyActiveCopy: {
    flex: 1
  },
  emptyActiveTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  emptyActiveText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 4
  },
  completedMissionRow: {
    minHeight: 72,
    opacity: 0.78
  },
  rowDetail: {
    marginTop: 7,
    gap: 6
  },
  missionTrailing: {
    width: 104,
    alignItems: "flex-end",
    gap: 8
  },
  rewardBadge: {
    maxWidth: 104,
    minHeight: 25,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.tint
  },
  rewardBadgeCompleted: {
    backgroundColor: statusColors.success.subtleBackground
  },
  rewardBadgeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  rewardBadgeTextCompleted: {
    color: colors.success
  },
  statusPill: {
    minHeight: 21,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.tint
  },
  statusPillCompleted: {
    backgroundColor: statusColors.success.subtleBackground
  },
  statusPillText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700"
  },
  statusPillTextCompleted: {
    color: colors.success
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  progressTrack: {
    height: 5,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: colors.tint
  },
  progressFill: {
    height: "100%",
    borderRadius: 4
  },
  rowAction: {
    maxWidth: 104,
    minHeight: 26,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2
  },
  rowActionText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "600"
  }
});
