import { useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { InlineNotice } from "../components/InlineNotice";
import { OpportunityListItem } from "../components/OpportunityListItem";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { partnerOffers } from "../data/appData";
import type { PartnerOffer } from "../data/appData";
import { partnerOfferLogos } from "../partnerOfferLogos";
import { getPartnerOfferValueLabel } from "../partnerOfferPresentation";
import { colors, radii, spacing, statusColors } from "../theme";
import type { ProductDisplayMode } from "../state/appState";

type PartnerOffersScreenProps = {
  initialOfferId?: string | null;
  claimedCouponIds: string[];
  pointsBalance: number;
  pointsInstantRedeemEnabled: boolean;
  onClaimCoupon: (couponId: string) => void;
  onPurchaseOffer: (offer: PartnerOffer, options?: { usePointsBenefit?: boolean }) => void;
  offerDisplayMode: ProductDisplayMode;
  onBack: () => void;
};

export function PartnerOffersScreen({
  initialOfferId,
  claimedCouponIds,
  pointsBalance,
  pointsInstantRedeemEnabled,
  onClaimCoupon,
  onPurchaseOffer,
  offerDisplayMode,
  onBack
}: PartnerOffersScreenProps) {
  const [activeOffer, setActiveOffer] = useState<PartnerOffer | null>(() =>
    initialOfferId ? partnerOffers.find((offer) => offer.id === initialOfferId) ?? null : null
  );
  const claimedCount = partnerOffers.filter((offer) =>
    offer.assetCouponId ? claimedCouponIds.includes(offer.assetCouponId) : false
  ).length;

  if (activeOffer) {
    const claimed = isOfferClaimed(activeOffer, claimedCouponIds);
    return (
      <PartnerOfferDetailScreen
        offer={activeOffer}
        claimed={claimed}
        pointsBalance={pointsBalance}
        pointsInstantRedeemEnabled={pointsInstantRedeemEnabled}
        onBack={() => setActiveOffer(null)}
        onAction={(usePointsBenefit) => {
          if (activeOffer.offerType === "claim_coupon" && activeOffer.assetCouponId) {
            onClaimCoupon(activeOffer.assetCouponId);
            return;
          }
          onPurchaseOffer(activeOffer, { usePointsBenefit });
        }}
      />
    );
  }

  return (
    <Screen
      title="Partner Offers"
      eyebrow="Local partners"
      scrollKey="partner-offers"
      onBack={onBack}
      backLabel="Back to Home"
    >
      <AppCard style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Available offers</Text>
          <Text style={styles.summaryValue}>{partnerOffers.length}</Text>
        </View>
        <Text style={styles.summaryHint}>{claimedCount} claimed</Text>
      </AppCard>

      <SectionHeader title="All Partner Offers" />
      <View style={offerDisplayMode === "card" ? styles.offerCardGrid : styles.offerList}>
        {partnerOffers.map((offer) => {
          const claimed = isOfferClaimed(offer, claimedCouponIds);
          return (
            <OpportunityListItem
              key={offer.id}
              leading={{
                type: "logo",
                label: offer.logoLabel,
                backgroundColor: offer.logoColor,
                color: offer.logoTextColor,
                image: partnerOfferLogos[offer.partnerId]
              }}
              title={offer.partnerName}
              offer={offer.title}
              meta={getOfferMeta(offer)}
              valueLabel={getPartnerOfferValueLabel(offer)}
              valueMeta={offerDisplayMode === "card" ? `${offer.claimedCount.toLocaleString("en-US")} ♥` : undefined}
              valueColor={colors.home.partnerValue}
              display={offerDisplayMode}
              style={offerDisplayMode === "card" ? styles.offerCardGridItem : undefined}
              onPress={() => setActiveOffer(offer)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

function PartnerOfferDetailScreen({
  offer,
  claimed,
  pointsBalance,
  pointsInstantRedeemEnabled,
  onBack,
  onAction
}: {
  offer: PartnerOffer;
  claimed: boolean;
  pointsBalance: number;
  pointsInstantRedeemEnabled: boolean;
  onBack: () => void;
  onAction: (usePointsBenefit?: boolean) => void;
}) {
  const valueLabel = getPartnerOfferValueLabel(offer);
  const offerKind = offer.offerType === "purchase_offer" ? "Purchase in app" : "Free to claim";
  const valueNote = offer.price && offer.retailValue
    ? `${offer.price} for ${offer.retailValue} value`
    : offer.price
      ? `${offer.price} in app`
      : "Free to claim";
  const isPurchaseOffer = offer.offerType === "purchase_offer";
  const pointsBenefit = isPurchaseOffer && pointsInstantRedeemEnabled ? calculateInstantPointsBenefit(parseCurrency(offer.price ?? "$0"), pointsBalance) : null;
  const [selectedBenefitId, setSelectedBenefitId] = useState(pointsBenefit?.pointsCost ? "points" : "none");
  const usePointsBenefit = pointsInstantRedeemEnabled && selectedBenefitId === "points" && Boolean(pointsBenefit?.pointsCost);
  const payableAmount = usePointsBenefit && pointsBenefit ? pointsBenefit.payableAmount : parseCurrency(offer.price ?? "$0");

  return (
    <Screen
      title="Offer Detail"
      eyebrow={offer.partnerName}
      scrollKey={`partner-offer-${offer.id}`}
      onBack={onBack}
      backLabel="Back to Offers"
      bottomAction={
        isPurchaseOffer ? (
          <BottomActionBar>
            <BottomActionSummary
              label="Payable After Benefits"
              value={formatCurrency(payableAmount)}
              meta={usePointsBenefit && pointsBenefit?.pointsCost ? `${pointsBenefit.pointsCost.toLocaleString("en-US")} Points applied` : "No Benefit"}
            />
            <BottomActionButton
              label="Continue"
              icon="lock-closed-outline"
              onPress={() => onAction(usePointsBenefit)}
            />
          </BottomActionBar>
        ) : (
          <BottomActionBar style={styles.claimActionBar}>
            <BottomActionButton
              label={claimed ? "Claimed" : offer.actionLabel}
              icon="ticket-outline"
              disabled={claimed}
              style={styles.claimActionButton}
              onPress={() => onAction(false)}
            />
          </BottomActionBar>
        )
      }
    >
      <AppCard style={styles.detailHero}>
        <View style={styles.detailHeroHeader}>
          <View style={styles.detailBrandBlock}>
            <View style={[styles.detailLogo, { backgroundColor: offer.logoColor }]}>
              {partnerOfferLogos[offer.partnerId] ? (
                <Image
                  source={partnerOfferLogos[offer.partnerId]}
                  style={styles.detailLogoImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.detailLogoText, { color: offer.logoTextColor }]}>{offer.logoLabel}</Text>
              )}
            </View>
            <View style={styles.detailBrandText}>
              <Text style={styles.detailPartnerName} numberOfLines={1}>{offer.partnerName}</Text>
              <Text style={styles.detailOfferKind}>{offerKind}</Text>
            </View>
          </View>
          <View style={styles.detailValueBlock}>
            <Text style={styles.detailValueMeta} numberOfLines={1}>
              {offer.offerType === "purchase_offer" ? "Pay" : "Save"}
            </Text>
            <Text style={[styles.detailValue, { color: colors.home.partnerValue }]} numberOfLines={1}>{valueLabel}</Text>
          </View>
        </View>

        <Text style={styles.detailTitle}>{offer.title}</Text>
        <Text style={styles.detailSubtitle}>{valueNote}</Text>

        <View style={styles.detailInfoStrip}>
          <View style={styles.detailInfoCell}>
            <Text style={styles.detailInfoLabel}>Popularity</Text>
            <Text style={styles.detailInfoValue} numberOfLines={1}>{offer.claimedCount.toLocaleString("en-US")} interested</Text>
          </View>
          <View style={styles.detailInfoDivider} />
          <View style={styles.detailInfoCell}>
            <Text style={styles.detailInfoLabel}>Ends</Text>
            <Text style={styles.detailInfoValue}>{offer.expires}</Text>
          </View>
          <View style={styles.detailInfoDivider} />
          <View style={styles.detailInfoCell}>
            <Text style={styles.detailInfoLabel}>Near</Text>
            <Text style={styles.detailInfoValue}>{offer.distance}</Text>
          </View>
        </View>
      </AppCard>

      {pointsInstantRedeemEnabled && pointsBenefit?.pointsCost ? (
        <>
          <SectionHeader title="Benefits" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.benefitChoiceList}
          >
            <BenefitChoice
              selected={selectedBenefitId === "points"}
              icon="sparkles-outline"
              title="Use Points"
              text={`${pointsBenefit.pointsCost.toLocaleString("en-US")} Points applied · Pay ${formatCurrency(pointsBenefit.payableAmount)}`}
              value={`-${formatCurrency(pointsBenefit.valueApplied)}`}
              onPress={() => setSelectedBenefitId("points")}
            />
            <BenefitChoice
              selected={selectedBenefitId === "none"}
              icon="remove-circle-outline"
              title="No Benefit"
              text="Pay full amount this time"
              value={offer.price ?? valueLabel}
              muted
              onPress={() => setSelectedBenefitId("none")}
            />
          </ScrollView>
        </>
      ) : null}

      <SectionHeader title="Visit & Redeem" />
      <InlineNotice
        icon={isPurchaseOffer ? "bag-check-outline" : "ticket-outline"}
        title="How to Redeem"
        text={getRedemptionNoticeCopy(offer)}
        tone="info"
        style={styles.redeemNotice}
      />
      <TouchableOpacity activeOpacity={0.84} onPress={() => openGoogleMap(offer)}>
        <AppCard style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location-outline" size={18} color={colors.coffee} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationTitle} numberOfLines={1}>{offer.partnerName}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{offer.address}</Text>
          </View>
          <View style={styles.locationAction}>
            <Ionicons name="navigate-outline" size={16} color={colors.coffee} />
            <Text style={styles.locationActionText}>Navigate</Text>
          </View>
        </AppCard>
      </TouchableOpacity>
    </Screen>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
    </View>
  );
}

function BenefitChoice({
  selected,
  icon,
  title,
  text,
  value,
  muted = false,
  onPress
}: {
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  value: string;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.84}
      style={[styles.benefitCard, selected && styles.benefitCardSelected]}
      onPress={onPress}
    >
      <View style={styles.benefitTop}>
        <View style={[styles.benefitIcon, selected && styles.benefitIconSelected]}>
          <Ionicons name={icon} size={16} color={selected ? colors.onDark : muted ? colors.muted : colors.coffee} />
        </View>
      </View>
      <Text style={styles.benefitTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{title}</Text>
      <Text style={[styles.benefitText, selected && styles.benefitTextSelected]} numberOfLines={1}>
        {muted ? "Pay full" : `Save ${value.replace("-", "")}`}
      </Text>
      {selected ? (
        <View style={styles.benefitSelectedRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.benefitSelectedText}>Selected</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function isOfferClaimed(offer: PartnerOffer, claimedCouponIds: string[]) {
  return Boolean(offer.assetCouponId && claimedCouponIds.includes(offer.assetCouponId));
}

function getOfferMeta(offer: PartnerOffer) {
  return `${offer.distance} away · Ends ${offer.expires}`;
}

function getRedemptionCopy(offer: PartnerOffer) {
  if (offer.offerType === "claim_coupon") {
    return "Claim in app, then use it at the partner.";
  }
  if (offer.purchaseCategory === "ticket") {
    return "Buy in app and show the ticket code at entry.";
  }
  return "Buy in app and redeem when dining in.";
}

function getRedemptionNoticeCopy(offer: PartnerOffer) {
  return getRedemptionCopy(offer);
}

function openGoogleMap(offer: PartnerOffer) {
  const query = encodeURIComponent(`${offer.partnerName} ${offer.address}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

function calculateInstantPointsBenefit(amount: number, pointsBalance: number) {
  const safeAmount = roundCurrency(Math.max(0, amount));
  const safePoints = Math.max(0, Math.floor(pointsBalance));
  if (safeAmount <= 0 || safePoints <= 0) {
    return {
      valueApplied: 0,
      pointsCost: 0,
      payableAmount: safeAmount
    };
  }
  const pointsPerDollar = 350;
  const fullCost = Math.ceil(safeAmount * pointsPerDollar);
  if (safePoints >= fullCost) {
    return {
      valueApplied: safeAmount,
      pointsCost: fullCost,
      payableAmount: 0
    };
  }
  const redeemableCents = Math.min(Math.floor((safePoints / pointsPerDollar) * 100), Math.round(safeAmount * 100));
  const valueApplied = roundCurrency(redeemableCents / 100);
  return {
    valueApplied,
    pointsCost: valueApplied > 0 ? Math.min(safePoints, Math.ceil(valueApplied * pointsPerDollar)) : 0,
    payableAmount: roundCurrency(safeAmount - valueApplied)
  };
}

function parseCurrency(value: string) {
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4
  },
  summaryHint: {
    color: colors.coffee,
    fontSize: 12,
    fontWeight: "800"
  },
  offerList: {
    gap: 10
  },
  offerCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  offerCardGridItem: {
    flexBasis: "48%"
  },
  detailHero: {
    alignItems: "flex-start",
    padding: 16
  },
  detailHeroHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14
  },
  detailBrandBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  detailLogo: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  detailLogoImage: {
    width: "100%",
    height: "100%"
  },
  detailLogoText: {
    fontSize: 15,
    fontWeight: "900"
  },
  detailBrandText: {
    flex: 1,
    minWidth: 0
  },
  detailPartnerName: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800"
  },
  detailOfferKind: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3
  },
  detailValueBlock: {
    minWidth: 74,
    alignItems: "flex-end",
    paddingTop: 1
  },
  detailValueMeta: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  detailValue: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 1,
    textAlign: "right",
    fontVariant: ["tabular-nums"]
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
    marginTop: 20
  },
  detailSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 5
  },
  detailInfoStrip: {
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.tint,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  detailInfoCell: {
    flex: 1,
    minWidth: 0
  },
  detailInfoDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.line
  },
  detailInfoLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  detailInfoValue: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    marginTop: 3
  },
  redeemNotice: {
    marginTop: 2
  },
  locationCard: {
    marginTop: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  locationCopy: {
    flex: 1,
    minWidth: 0
  },
  locationTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800"
  },
  locationAddress: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 3
  },
  locationAction: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  locationActionText: {
    color: colors.coffee,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  claimActionBar: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  claimActionButton: {
    flex: 1,
    width: "100%"
  },
  benefitChoiceList: {
    gap: 9,
    paddingRight: spacing.md
  },
  benefitCard: {
    width: 138,
    minHeight: 104,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  benefitCardSelected: {
    borderColor: colors.success,
    borderWidth: 1.5,
    backgroundColor: statusColors.success.background
  },
  benefitTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start"
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  benefitIconSelected: {
    backgroundColor: colors.success
  },
  benefitTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    marginTop: 9
  },
  benefitText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3
  },
  benefitTextSelected: {
    color: colors.success
  },
  benefitSelectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7
  },
  benefitSelectedText: {
    color: colors.success,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  detailRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  detailRowLast: {
    borderBottomWidth: 0
  },
  detailRowLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  detailRowValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "right"
  },
});
