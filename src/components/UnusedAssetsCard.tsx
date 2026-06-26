import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { memberAssets, vouchers } from "../data/appData";
import { getTierProgress, TierName } from "../tiers";
import { getTierVisual, TierVisual } from "../tierVisuals";
import { AppCard } from "./AppCard";
import { TierCardBackdrop } from "./TierCardBackdrop";
import { WalletBalances } from "../types";
import { BonusSummary } from "../bonusSummary";

type UnusedAssetsCardProps = {
  cardholderName: string;
  walletBalance: number;
  walletBalances: WalletBalances;
  bonusSummary: BonusSummary;
  pointsBalance: number;
  xpBalance: number;
  claimedCouponCount: number;
  onOpenWallet: () => void;
  onTopUp: () => void;
  onOpenVouchers: () => void;
  onOpenCoupons: () => void;
  onOpenPoints: () => void;
  onOpenMemberGrowth: () => void;
};

export function UnusedAssetsCard({
  cardholderName,
  walletBalance,
  walletBalances,
  bonusSummary,
  pointsBalance,
  xpBalance,
  claimedCouponCount,
  onOpenWallet,
  onTopUp,
  onOpenVouchers,
  onOpenCoupons,
  onOpenPoints,
  onOpenMemberGrowth
}: UnusedAssetsCardProps) {
  const { currentTier } = getTierProgress(xpBalance);
  const visual = getTierVisual(currentTier);
  const tierIdentity = getTierIdentityCopy(currentTier.name);
  const cardNumber = formatWalletCardNumber(
    memberAssets.registeredDate,
    memberAssets.dailyRegistrationSequence
  );
  const activeVoucherCount = vouchers.filter((voucher) => voucher.status === "Active").length;

  return (
    <AppCard style={styles.card}>
      <View
        style={[
          styles.cardMain,
          {
            backgroundColor: visual.background,
            borderColor: visual.border,
            shadowColor: visual.shadow
          }
        ]}
      >
        <TierCardBackdrop visual={visual} />
        <View style={[styles.cardShadowWash, { backgroundColor: visual.shadow }]} />
        <View style={[styles.cardTopHighlight, { backgroundColor: visual.highlight }]} />
        <View style={[styles.metalBand, styles.metalBandTop, { backgroundColor: visual.highlight }]} />
        <View style={[styles.metalBand, styles.metalBandMidDark, { backgroundColor: visual.shadow }]} />
        <View style={[styles.metalBand, styles.metalBandLower, { backgroundColor: visual.gloss }]} />
        <View style={[styles.metalEdgeLight, { backgroundColor: visual.highlight }]} />
        <View style={[styles.cardGlossBand, { backgroundColor: visual.gloss }]} />
        <View style={[styles.cardShine, { backgroundColor: visual.gloss }]} />
        <Pressable style={styles.tierTop} onPress={onOpenMemberGrowth}>
          <View style={styles.brandBlock}>
            <View style={[styles.brandMark, { borderColor: visual.accent }]}>
              <Text style={[styles.brandMarkText, { color: visual.primaryText }]}>GA</Text>
            </View>
            <View>
              <Text style={[styles.kicker, { color: visual.mutedText }]}>Wallet eCard</Text>
              <Text style={[styles.tierName, { color: visual.primaryText }]}>{currentTier.name} Member</Text>
              <Text style={[styles.tierTagline, { color: visual.accent }]}>{tierIdentity.tagline}</Text>
            </View>
          </View>
          <View style={styles.cardStatus}>
            <View style={[styles.pointsBoost, { backgroundColor: visual.tileBackground, borderColor: visual.accent }]}>
              <Text style={[styles.pointsBoostLabel, { color: visual.accent }]}>
                {tierIdentity.boostLabel}
              </Text>
              <Text style={[styles.pointsBoostText, { color: visual.primaryText }]}>
                {currentTier.pointsPerDollar} Points / $1
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.cardCenter}>
          <Pressable style={styles.balanceArea} onPress={onOpenWallet}>
            <Text style={[styles.primaryLabel, { color: visual.mutedText }]}>Available Balance</Text>
          <Text style={[styles.value, { color: visual.primaryText }]}>
            {formatCurrency(walletBalance)}
          </Text>
          <Text style={[styles.balanceBreakdown, { color: visual.mutedText }]}>
            Cash {formatCurrency(walletBalances.cash)} · Bonus {formatCurrency(walletBalances.rewardsBonus)}
          </Text>
          </Pressable>
          <Pressable
            style={[
              styles.topUpButton,
              {
                backgroundColor: visual.actionBackground,
                borderColor: visual.accent
              }
            ]}
            onPress={onTopUp}
          >
            <Ionicons name="add" size={16} color={visual.accent} />
            <Text style={[styles.topUpText, { color: visual.accent }]}>Add Funds</Text>
          </Pressable>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.cardMetaValue, { color: visual.primaryText }]} numberOfLines={1}>
              {cardholderName.toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardNumberBlock}>
            <Text style={[styles.cardNumber, { color: visual.primaryText }]}>NO. {cardNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.stubConnector}>
        {Array.from({ length: 65 }, (_, index) => (
          <View
            key={`stub-dot-${index}`}
            style={[styles.stubDot, { backgroundColor: visual.accent }]}
          />
        ))}
      </View>

      <View
        style={[
          styles.assetStub,
          {
            backgroundColor: visual.background,
            borderColor: visual.border,
            shadowColor: visual.shadow
          }
        ]}
      >
        <AssetItem
          label="Bonus Earned"
          value={formatCurrency(bonusSummary.earned)}
          visual={visual}
          onPress={onTopUp}
        />
        <View style={[styles.assetDivider, { backgroundColor: visual.accent }]} />
        <AssetItem
          label="Voucher"
          value={String(activeVoucherCount)}
          visual={visual}
          onPress={onOpenVouchers}
        />
        <View style={[styles.assetDivider, { backgroundColor: visual.accent }]} />
        <AssetItem
          label="Coupon"
          value={String(claimedCouponCount)}
          visual={visual}
          onPress={onOpenCoupons}
        />
        <View style={[styles.assetDivider, { backgroundColor: visual.accent }]} />
        <AssetItem
          label="Points"
          value={pointsBalance.toLocaleString()}
          visual={visual}
          onPress={onOpenPoints}
        />
      </View>
    </AppCard>
  );
}

function AssetItem({
  label,
  value,
  detail,
  visual,
  onPress
}: {
  label: string;
  value: string;
  detail?: string;
  visual: TierVisual;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.itemTop}>
        <Text style={[styles.itemValue, { color: visual.primaryText }]}>{value}</Text>
        {onPress ? <Ionicons name="chevron-forward" size={13} color={visual.accent} /> : null}
      </View>
      <Text style={[styles.itemLabel, { color: visual.mutedText }]} numberOfLines={1}>
        {label}
      </Text>
      {detail ? (
        <Text style={[styles.itemDetail, { color: visual.subtleText }]} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.item, { backgroundColor: visual.tileBackground }]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.item, styles.itemTap]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatWalletCardNumber(registeredDate: string, dailySequence: number) {
  const datePrefix = registeredDate.replaceAll("-", "");
  return `${datePrefix} ${String(dailySequence).padStart(5, "0")}`;
}

function getTierIdentityCopy(tierName: TierName) {
  switch (tierName) {
    case "Green":
      return {
        tagline: "Save More Every Day",
        boostLabel: "GREEN START"
      };
    case "Gold":
      return {
        tagline: "Unlock Extra Rewards",
        boostLabel: "GOLD BOOST"
      };
    case "Platinum":
      return {
        tagline: "Your Everyday VIP",
        boostLabel: "VIP BOOST"
      };
    case "Diamond":
      return {
        tagline: "Maximum Value",
        boostLabel: "MAX BOOST"
      };
  }
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    overflow: "visible"
  },
  cardMain: {
    width: "100%",
    aspectRatio: 1.86,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  cardShadowWash: {
    position: "absolute",
    width: 220,
    height: 160,
    right: -88,
    bottom: -86,
    opacity: 0.18,
    borderRadius: 80,
    transform: [{ rotate: "-18deg" }]
  },
  cardTopHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 58,
    opacity: 0.16
  },
  metalBand: {
    position: "absolute",
    left: -42,
    right: -42,
    borderRadius: 32,
    transform: [{ rotate: "-7deg" }]
  },
  metalBandTop: {
    top: 28,
    height: 18,
    opacity: 0.16
  },
  metalBandMidDark: {
    top: 74,
    height: 24,
    opacity: 0.12
  },
  metalBandLower: {
    bottom: 22,
    height: 20,
    opacity: 0.2
  },
  metalEdgeLight: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    opacity: 0.5
  },
  cardGlossBand: {
    position: "absolute",
    width: 96,
    height: 260,
    top: -86,
    left: 106,
    opacity: 0.24,
    transform: [{ rotate: "28deg" }]
  },
  cardShine: {
    position: "absolute",
    width: 180,
    height: 26,
    top: 26,
    right: -48,
    opacity: 0.34,
    borderRadius: 20,
    transform: [{ rotate: "-24deg" }]
  },
  tierTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5
  },
  brandMarkText: {
    fontSize: 12,
    fontWeight: "800"
  },
  kicker: {
    fontSize: 10,
    fontWeight: "700"
  },
  tierName: {
    fontSize: 18,
    marginTop: 2,
    fontWeight: "800"
  },
  tierTagline: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: "700"
  },
  cardStatus: {
    alignItems: "flex-end",
  },
  pointsBoost: {
    minHeight: 39,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  pointsBoostLabel: {
    fontSize: 8,
    fontWeight: "800"
  },
  pointsBoostText: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  cardCenter: {
    flex: 1,
    minHeight: 58,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  balanceArea: {
    flex: 1
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
    marginTop: 2
  },
  primaryLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  balanceBreakdown: {
    fontSize: 8,
    fontWeight: "600",
    marginTop: 3
  },
  topUpButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth
  },
  topUpText: {
    fontSize: 11,
    fontWeight: "700"
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14
  },
  cardMetaValue: {
    maxWidth: 130,
    fontSize: 10,
    fontWeight: "700"
  },
  cardNumberBlock: {
    alignItems: "flex-end",
  },
  cardNumber: {
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  assetStub: {
    width: "100%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderStyle: "solid",
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 5
  },
  stubConnector: {
    height: 6,
    marginVertical: -3,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 3
  },
  stubDot: {
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    opacity: 0.95
  },
  assetDivider: {
    width: 1,
    marginVertical: 5,
    opacity: 0.78
  },
  item: {
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: 8,
    paddingLeft: 9,
    paddingRight: 5,
    paddingTop: 12,
    paddingBottom: 1
  },
  itemTap: {
    minHeight: 44
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4
  },
  itemValue: {
    fontSize: 13,
    fontWeight: "700"
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3
  },
  itemDetail: {
    fontSize: 8,
    fontWeight: "700",
    marginTop: 3
  },
});
