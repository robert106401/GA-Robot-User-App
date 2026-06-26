import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AppCard } from "../components/AppCard";
import { FilterPills } from "../components/FilterPills";
import { InlineNotice } from "../components/InlineNotice";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { coupons, partnerOffers, vouchers } from "../data/appData";
import { colors } from "../theme";
import type { PartnerOfferPurchaseRecord, RedeemedPointReward, UsedBenefitRecord } from "../types";

type CouponListScreenProps = {
  claimedCouponIds: string[];
  purchasedPartnerOffers: PartnerOfferPurchaseRecord[];
  redeemedPointRewards: RedeemedPointReward[];
  usedBenefitIds: string[];
  usedBenefitRecords: UsedBenefitRecord[];
  initialAsset?: CouponAssetTarget | null;
  initialFilter?: RewardFilter;
  onBack: () => void;
};

type AssetStatus = "Active" | "Used" | "Expired" | "Claimed";
export type CouponAssetTarget =
  | { type: "voucher"; id: string }
  | { type: "partnerVoucher"; id: string }
  | { type: "coupon"; id: string }
  | { type: "pointReward"; id: string };
type VoucherListEntry =
  | { type: "voucher"; voucher: (typeof vouchers)[number]; originalIndex: number }
  | { type: "partnerVoucher"; purchase: PartnerOfferPurchaseRecord; offer: (typeof partnerOffers)[number]; originalIndex: number };
export type RewardFilter = "All" | "Vouchers" | "Coupons" | "Expiring Soon" | "Used";
type RewardAssetTab = "Vouchers" | "Coupons";
type RewardStatusFilter = "All" | "Expiring Soon" | "Used";
type RewardListEntry =
  | VoucherListEntry
  | { type: "coupon"; coupon: (typeof coupons)[number]; originalIndex: number }
  | { type: "pointReward"; reward: RedeemedPointReward; originalIndex: number };

const rewardAssetTabs: Array<{ key: RewardAssetTab; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "Vouchers", icon: "gift-outline" },
  { key: "Coupons", icon: "ticket-outline" }
];

export function CouponListScreen({
  claimedCouponIds,
  purchasedPartnerOffers,
  redeemedPointRewards,
  usedBenefitIds,
  usedBenefitRecords,
  initialAsset = null,
  initialFilter = "All",
  onBack
}: CouponListScreenProps) {
  const [activeAsset, setActiveAsset] = useState<CouponAssetTarget | null>(initialAsset);
  const [activeRewardTab, setActiveRewardTab] = useState<RewardAssetTab>(getInitialRewardTab(initialFilter));
  const [activeStatusFilter, setActiveStatusFilter] = useState<RewardStatusFilter>(getInitialStatusFilter(initialFilter));
  const claimedCoupons = coupons.filter((coupon) => claimedCouponIds.includes(coupon.id));
  const partnerVouchers = purchasedPartnerOffers
    .map((purchase, index) => {
      const offer = partnerOffers.find((item) => item.id === purchase.offerId && item.offerType === "purchase_offer");
      return offer ? { purchase, offer, originalIndex: index } : null;
    })
    .filter((item): item is { purchase: PartnerOfferPurchaseRecord; offer: (typeof partnerOffers)[number]; originalIndex: number } => Boolean(item));
  const sortedVouchers: VoucherListEntry[] = [
    ...vouchers.map((voucher, index) => ({ type: "voucher" as const, voucher, originalIndex: index })),
    ...partnerVouchers.map((item) => ({ type: "partnerVoucher" as const, ...item }))
  ].sort(sortVoucherEntry);
  const sortedCoupons = claimedCoupons
    .map((coupon, index) => ({ coupon, originalIndex: index }))
    .sort(sortCouponEntry);
  const sortedPointRewards = redeemedPointRewards
    .map((reward, index) => ({ type: "pointReward" as const, reward, originalIndex: index }))
    .sort(sortRewardEntry);
  const rewardEntries: RewardListEntry[] = [
    ...sortedVouchers,
    ...sortedCoupons.map((entry) => ({ type: "coupon" as const, ...entry })),
    ...sortedPointRewards
  ].sort(sortRewardEntry);
  const voucherEntryCount = sortedVouchers.length + sortedPointRewards.filter((entry) => entry.reward.rewardType === "Voucher").length;
  const couponEntryCount = sortedCoupons.length + sortedPointRewards.filter((entry) => entry.reward.rewardType === "Coupon").length;
  const tabRewardEntries = rewardEntries.filter((entry) => isRewardEntryInTab(entry, activeRewardTab));
  const filteredRewardEntries = tabRewardEntries.filter((entry) => {
    const status = getRewardEntryStatus(entry, usedBenefitIds);
    if (activeStatusFilter === "Expiring Soon") {
      return isRewardEntryExpiringSoon(entry) && isAssetActive(status);
    }
    if (activeStatusFilter === "Used") {
      return status === "Used";
    }
    return true;
  });

  useEffect(() => {
    setActiveAsset(initialAsset);
  }, [initialAsset]);

  useEffect(() => {
    setActiveRewardTab(getInitialRewardTab(initialFilter));
    setActiveStatusFilter(getInitialStatusFilter(initialFilter));
  }, [initialFilter]);

  const handleAssetBack = () => {
    if (initialAsset) {
      onBack();
      return;
    }
    setActiveAsset(null);
  };

  if (activeAsset) {
    if (activeAsset.type === "voucher") {
      const voucher = vouchers.find((item) => item.id === activeAsset.id);
      if (voucher) {
        return (
          <VoucherDetailScreen
            voucher={voucher}
            used={usedBenefitIds.includes(createBenefitUsageKey("Voucher", voucher.id))}
            usedAt={getUsedBenefitAt(usedBenefitRecords, createBenefitUsageKey("Voucher", voucher.id))}
            onBack={handleAssetBack}
          />
        );
      }
    } else if (activeAsset.type === "partnerVoucher") {
      const partnerVoucher = partnerVouchers.find((item) => item.purchase.code === activeAsset.id);
      if (partnerVoucher) {
        return (
          <PartnerVoucherDetailScreen
            purchase={partnerVoucher.purchase}
            offer={partnerVoucher.offer}
            onBack={handleAssetBack}
          />
        );
      }
    } else if (activeAsset.type === "pointReward") {
      const pointReward = redeemedPointRewards.find((item) => item.id === activeAsset.id);
      if (pointReward) {
        return (
          <PointRewardDetailScreen
            reward={pointReward}
            onBack={handleAssetBack}
          />
        );
      }
    } else {
      const coupon = coupons.find((item) => item.id === activeAsset.id);
      if (coupon) {
      return (
          <CouponDetailScreen
            coupon={coupon}
            used={usedBenefitIds.includes(createBenefitUsageKey("Coupon", coupon.id))}
            usedAt={getUsedBenefitAt(usedBenefitRecords, createBenefitUsageKey("Coupon", coupon.id))}
            onBack={handleAssetBack}
          />
      );
      }
    }
  }

  return (
    <Screen title="My Rewards" eyebrow="Redeemable assets" scrollKey="coupons" onBack={onBack}>
      <Text style={styles.rewardsHelper}>Vouchers redeem items. Coupons reduce your price.</Text>

      <View style={styles.rewardTabBar}>
        {rewardAssetTabs.map((tab) => {
          const active = activeRewardTab === tab.key;
          const count = tab.key === "Vouchers" ? voucherEntryCount : couponEntryCount;
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              activeOpacity={0.82}
              style={[styles.rewardTab, active && styles.rewardTabActive]}
              onPress={() => {
                setActiveRewardTab(tab.key);
                setActiveStatusFilter("All");
              }}
            >
              <Ionicons name={tab.icon} size={16} color={active ? colors.onDark : colors.muted} />
              <Text style={[styles.rewardTabText, active && styles.rewardTabTextActive]}>{tab.key}</Text>
              <Text style={[styles.rewardTabCount, active && styles.rewardTabCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterWrap}>
        <FilterPills
          activeValue={activeStatusFilter}
          onChange={setActiveStatusFilter}
          options={[
            { value: "All", icon: "sparkles-outline", count: tabRewardEntries.length },
            { value: "Expiring Soon", icon: "time-outline", count: tabRewardEntries.filter((entry) => isRewardEntryExpiringSoon(entry) && isAssetActive(getRewardEntryStatus(entry, usedBenefitIds))).length },
            { value: "Used", icon: "checkmark-done-outline", count: tabRewardEntries.filter((entry) => getRewardEntryStatus(entry, usedBenefitIds) === "Used").length }
          ]}
        />
      </View>

      <AppCard style={styles.assetListCard}>
        {filteredRewardEntries.length ? filteredRewardEntries.map((entry, index) => {
          if (entry.type === "partnerVoucher") {
            const { purchase, offer } = entry;
            return (
              <RecordListItem
                key={purchase.code}
                leading={{
                  type: "icon",
                  icon: offer.purchaseCategory === "ticket" ? "ticket-outline" : "restaurant-outline",
                  tone: "voucher",
                  color: colors.coffee
                }}
                title={offer.title}
                secondary={`${offer.partnerName} · ${offer.price ?? "Purchased"}`}
                source="Partner Offer"
                datetime={`Expires ${offer.expires}`}
                recordId={purchase.code}
                trailing={{
                  type: "countdown",
                  expiresAt: offer.validUntil,
                  active: true
                }}
                last={index === filteredRewardEntries.length - 1}
                onPress={() => setActiveAsset({ type: "partnerVoucher", id: purchase.code })}
              />
            );
          }
          if (entry.type === "coupon") {
            const status = getCouponAssetStatus(entry.coupon, usedBenefitIds);
            const expiry = getCouponExpiryLabel(entry.coupon);
            const isActive = isAssetActive(status);
            return (
              <RecordListItem
                key={entry.coupon.id}
                leading={{ type: "icon", icon: "ticket-outline", tone: "neutral", color: colors.ink }}
                title={entry.coupon.merchant}
                secondary={entry.coupon.offer}
                source={getCouponSourceLabel(entry.coupon)}
                datetime={expiry.label}
                recordId={entry.coupon.code}
                trailing={{
                  type: "countdown",
                  expiresAt: parseCouponExpiresAt(entry.coupon.expires),
                  active: isActive,
                  inactiveLabel: status
                }}
                last={index === filteredRewardEntries.length - 1}
                onPress={() => setActiveAsset({ type: "coupon", id: entry.coupon.id })}
              />
            );
          }
          if (entry.type === "pointReward") {
            const isActive = isAssetActive(entry.reward.status);
            return (
              <RecordListItem
                key={entry.reward.id}
                leading={{
                  type: "icon",
                  icon: entry.reward.rewardType === "Coupon" ? "ticket-outline" : "gift-outline",
                  tone: entry.reward.rewardType === "Coupon" ? "neutral" : "warning",
                  color: entry.reward.rewardType === "Coupon" ? colors.ink : colors.coffee
                }}
                title={entry.reward.title}
                secondary={entry.reward.description}
                source="Points Shop"
                datetime={`Expires ${entry.reward.expiresAt}`}
                recordId={entry.reward.code}
                trailing={{
                  type: "countdown",
                  expiresAt: entry.reward.expiresAt,
                  active: isActive,
                  inactiveLabel: entry.reward.status
                }}
                last={index === filteredRewardEntries.length - 1}
                onPress={() => setActiveAsset({ type: "pointReward", id: entry.reward.id })}
              />
            );
          }
          const expiry = getExpiryLabel(entry.voucher.expires, entry.voucher.status);
          const status = getVoucherAssetStatus(entry.voucher, usedBenefitIds);
          const isActive = isAssetActive(status);
          return (
            <RecordListItem
              key={entry.voucher.id}
              leading={{ type: "icon", icon: "gift-outline", tone: "warning", color: colors.coffee }}
              title={entry.voucher.title}
              secondary={`${entry.voucher.scope} · Up to $${entry.voucher.value.toFixed(2)}`}
              source={entry.voucher.source}
              datetime={expiry.label}
              recordId={entry.voucher.code}
              trailing={{
                type: "countdown",
                expiresAt: entry.voucher.expiresAt,
                active: isActive,
                inactiveLabel: status
              }}
              last={index === filteredRewardEntries.length - 1}
              onPress={() => setActiveAsset({ type: "voucher", id: entry.voucher.id })}
            />
          );
        }) : (
          <View style={styles.emptyStateInline}>
            <Text style={styles.emptyTitle}>{activeRewardTab === "Coupons" ? "No Claimed Coupons Yet" : "No Vouchers Yet"}</Text>
            <Text style={styles.emptyText}>
              {activeRewardTab === "Coupons" ? "Claim Partner Coupons on Home to add them here." : "Vouchers you own will appear here."}
            </Text>
          </View>
        )}
      </AppCard>
    </Screen>
  );
}

function VoucherDetailScreen({ voucher, used, usedAt, onBack }: { voucher: (typeof vouchers)[number]; used: boolean; usedAt?: string; onBack: () => void }) {
  const status = used ? "Used" : voucher.status;
  const expiresLabel = formatRewardDate(voucher.expiresAt);
  const resolvedUsedAt = usedAt ?? voucher.usedAt;
  return (
    <Screen
      title="Voucher Detail"
      eyebrow={voucher.title}
      scrollKey={`asset-detail-${voucher.id}`}
      onBack={onBack}
    >
      <RewardDetailHero
        icon="gift-outline"
        tone="voucher"
        typeLabel="VOUCHER"
        code={voucher.code}
        title={voucher.title}
        value={`Up to $${voucher.value.toFixed(2)}`}
        description={voucher.scope}
        status={status}
        statusTone={getAssetStatusTone(status)}
        note={voucher.redeemRules}
      />
      <RewardStatusTimeline
        status={status}
        issuedLabel={`${formatRewardCodeDate(voucher.code)} · Issued by ${voucher.source}`}
        activeLabel={getRewardActiveLabel(status, expiresLabel)}
        usedLabel={getRewardUsedLabel(status, resolvedUsedAt, "Selected during eligible checkout")}
      />
      <InlineNotice
        icon="sparkles-outline"
        title="Use as a Benefit"
        text="This voucher can be selected during eligible app checkout. No code is needed at the VM."
        tone="info"
        style={styles.rewardNotice}
      />
    </Screen>
  );
}

function PartnerVoucherDetailScreen({
  purchase,
  offer,
  onBack
}: {
  purchase: PartnerOfferPurchaseRecord;
  offer: (typeof partnerOffers)[number];
  onBack: () => void;
}) {
  const status: AssetStatus = "Active";
  return (
    <Screen
      title="Partner Voucher Detail"
      eyebrow={offer.partnerName}
      scrollKey={`partner-voucher-detail-${purchase.code}`}
      onBack={onBack}
    >
      <RewardDetailHero
        icon={offer.purchaseCategory === "ticket" ? "ticket-outline" : "restaurant-outline"}
        tone="voucher"
        typeLabel={offer.purchaseCategory === "ticket" ? "TICKET" : "PARTNER VOUCHER"}
        code={purchase.code}
        title={offer.title}
        value={offer.price ?? offer.retailValue ?? "Partner Offer"}
        description={offer.partnerName}
        status={status}
        statusTone="active"
        note={offer.description}
      />
      <RewardStatusTimeline
        status={status}
        issuedLabel={`${purchase.purchasedAt} · Purchased`}
        activeLabel={`Expires ${formatRewardDisplayDate(offer.expires)}`}
        usedLabel={offer.purchaseCategory === "ticket" ? "Show ticket code at entry" : "Redeem with partner validation"}
      />
      <InlineNotice
        icon={offer.purchaseCategory === "ticket" ? "ticket-outline" : "restaurant-outline"}
        title="How to Redeem"
        text={getPartnerAssetRedeemCopy(offer)}
        tone="info"
        style={styles.rewardNotice}
      />
      <RewardActionRow
        primaryLabel={offer.purchaseCategory === "ticket" ? "Show Ticket Code" : "Show Voucher Code"}
        onPrimaryPress={() => showRewardAction(offer.purchaseCategory === "ticket" ? "Ticket Code" : "Partner Voucher Code", purchase.code)}
      />
      <PartnerLocationCard offer={offer} />
    </Screen>
  );
}

function CouponDetailScreen({ coupon, used, usedAt, onBack }: { coupon: (typeof coupons)[number]; used: boolean; usedAt?: string; onBack: () => void }) {
  const status = used ? "Used" : coupon.status === "Expired" || coupon.status === "Used" ? coupon.status : "Claimed";
  const expiresLabel = formatRewardDisplayDate(coupon.expires);
  const partnerOffer = partnerOffers.find((offer) => offer.assetCouponId === coupon.id);
  const partnerCouponNotice = Boolean(partnerOffer);
  return (
    <Screen
      title="Coupon Detail"
      eyebrow={coupon.merchant}
      scrollKey={`asset-detail-${coupon.id}`}
      onBack={onBack}
    >
      <RewardDetailHero
        icon="ticket-outline"
        tone="coupon"
        typeLabel="COUPON"
        code={coupon.code}
        title={coupon.merchant}
        value={coupon.offer}
        description={coupon.kind}
        status={status}
        statusTone={getAssetStatusTone(status)}
        note={getCouponDetailSignal(coupon)}
      />
      <RewardStatusTimeline
        status={status}
        issuedLabel={`${formatRewardCodeDate(coupon.code)} · Claimed from ${coupon.kind}`}
        activeLabel={getRewardActiveLabel(status, expiresLabel)}
        usedLabel={getRewardUsedLabel(status, usedAt, partnerCouponNotice ? "Use at the partner location" : "Selected during eligible checkout")}
      />
      <InlineNotice
        icon="ticket-outline"
        title={partnerCouponNotice ? "Use at Partner" : "Use as a Benefit"}
        text={partnerCouponNotice ? "Show this coupon at the partner location. The partner validates it on site." : "This coupon can be selected during eligible app checkout. No code is needed at the VM."}
        tone="info"
        style={styles.rewardNotice}
      />
      {partnerOffer ? <PartnerLocationCard offer={partnerOffer} /> : null}
    </Screen>
  );
}

function PointRewardDetailScreen({ reward, onBack }: { reward: RedeemedPointReward; onBack: () => void }) {
  const expiresLabel = formatRewardDate(reward.expiresAt);
  return (
    <Screen
      title={`${reward.rewardType} Detail`}
      eyebrow="Points Shop"
      scrollKey={`point-reward-detail-${reward.id}`}
      onBack={onBack}
    >
      <RewardDetailHero
        icon={reward.rewardType === "Coupon" ? "ticket-outline" : "gift-outline"}
        tone={reward.rewardType === "Coupon" ? "coupon" : "voucher"}
        typeLabel={`POINTS ${reward.rewardType.toUpperCase()}`}
        code={reward.code}
        title={reward.title}
        value={reward.rewardType}
        description={reward.description}
        status={reward.status}
        statusTone={getAssetStatusTone(reward.status)}
        note={`${reward.pointsCost.toLocaleString()} Points redeemed`}
      />
      <RewardStatusTimeline
        status={reward.status}
        issuedLabel={`${reward.date} · Redeemed with Points`}
        activeLabel={getRewardActiveLabel(reward.status, expiresLabel)}
        usedLabel={getRewardUsedLabel(reward.status, reward.usedAt, "Selected during eligible checkout")}
      />
      <InlineNotice
        icon="sparkles-outline"
        title="Use as a Benefit"
        text={reward.rewardType === "Coupon" ? "Select this coupon during eligible checkout. No code is needed at the VM." : "Select this voucher during eligible checkout. No code is needed at the VM."}
        tone="info"
        style={styles.rewardNotice}
      />
    </Screen>
  );
}

type RewardDetailHeroProps = {
  icon: keyof typeof Ionicons.glyphMap;
  tone: "voucher" | "coupon";
  typeLabel: string;
  code: string;
  title: string;
  value: string;
  description: string;
  status: string;
  statusTone: "active" | "used" | "expired";
  note: string;
};

function RewardDetailHero({
  icon,
  tone,
  typeLabel,
  code,
  title,
  value,
  description,
  status,
  statusTone,
  note
}: RewardDetailHeroProps) {
  const palette = getRewardDetailPalette(tone, statusTone);
  return (
    <View style={[styles.rewardDetailHero, { backgroundColor: palette.background, borderColor: palette.accent }]}>
      <View style={[styles.rewardDetailGlow, { backgroundColor: palette.soft }]} />
      <View style={styles.rewardMetaRow}>
        <View style={styles.rewardMetaItem}>
          <Text style={styles.rewardMetaLabel}>ASSET TYPE</Text>
          <Text style={styles.rewardMetaValue} numberOfLines={1}>{typeLabel}</Text>
        </View>
        <View style={styles.rewardMetaDivider} />
        <View style={[styles.rewardMetaItem, styles.rewardMetaItemRight]}>
          <Text style={styles.rewardMetaLabel}>ASSET CODE</Text>
          <Text style={styles.rewardMetaValue} numberOfLines={1}>{code}</Text>
        </View>
      </View>
      <View style={styles.rewardDetailHeader}>
        <View style={styles.rewardDetailTitleGroup}>
          <Text style={styles.rewardDetailOccasion}>{description.toUpperCase()}</Text>
          <Text style={styles.rewardDetailTitle} numberOfLines={2}>{title}</Text>
        </View>
        <View style={styles.rewardStatusPill}>
          <Text style={styles.rewardStatusText}>{status}</Text>
        </View>
      </View>
      <View style={styles.rewardDetailBody}>
        <View style={styles.rewardDetailCopy}>
          <Text style={styles.rewardHeroValue} numberOfLines={2}>{value}</Text>
          <Text style={styles.rewardHeroNote} numberOfLines={3}>{note}</Text>
        </View>
        <View style={styles.rewardDetailMark}>
          <Ionicons name={icon} size={32} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

function RewardStatusTimeline({
  status,
  issuedLabel,
  activeLabel,
  usedLabel
}: {
  status: AssetStatus | RedeemedPointReward["status"];
  issuedLabel: string;
  activeLabel: string;
  usedLabel: string;
}) {
  const normalizedStatus = status === "Claimed" ? "Active" : status;
  const activeState = normalizedStatus === "Active" ? "current" as const : "done" as const;
  const steps = [
    { title: "Issued", text: issuedLabel, state: "done" as const },
    {
      title: "Active",
      text: activeLabel,
      state: activeState
    },
    {
      title: normalizedStatus === "Expired" ? "Expired" : "Used",
      text: normalizedStatus === "Active" ? usedLabel : normalizedStatus === "Expired" ? `${getRewardExpiredLabel(activeLabel)} · Not used before expiry` : usedLabel,
      state: normalizedStatus === "Active" ? "pending" as const : normalizedStatus === "Expired" ? "danger" as const : "done" as const
    }
  ];

  return (
    <AppCard style={styles.timelineCard}>
      <Text style={styles.timelineTitle}>Status Timeline</Text>
      <View>
        {steps.map((step, index) => {
          const stateStyle = getTimelineStateStyle(step.state);
          const isLast = index === steps.length - 1;
          return (
            <View key={`${step.title}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, stateStyle.dot]} />
                {!isLast ? <View style={[styles.timelineLine, stateStyle.line]} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={[styles.timelineStepTitle, stateStyle.title]}>{step.title}</Text>
                <Text style={styles.timelineStepText}>{step.text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

function formatRewardCodeDate(code: string) {
  const match = code.match(/^[A-Z]+-(\d{2})(\d{2})(\d{2})-/);
  if (!match) {
    return "Issue date unavailable";
  }
  const [, year, month, day] = match;
  return formatRewardDate(`20${year}-${month}-${day}`);
}

function formatRewardDisplayDate(value: string) {
  const parsed = new Date(`${value} 2026`);
  if (!Number.isNaN(parsed.getTime())) {
    return formatRewardDate(parsed.toISOString().slice(0, 10));
  }
  return value;
}

function formatRewardDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

function getRewardActiveLabel(_status: AssetStatus | RedeemedPointReward["status"], expiresLabel: string) {
  return `Expires ${expiresLabel}`;
}

function getRewardExpiredLabel(activeLabel: string) {
  return activeLabel.replace(/^Expires /, "Expired ");
}

function getRewardUsedLabel(status: AssetStatus | RedeemedPointReward["status"], usedAt: string | undefined, fallback: string) {
  if (status !== "Used") {
    return fallback;
  }
  return `${usedAt ?? "2026-06-21 09:00"} · ${fallback}`;
}

function getUsedBenefitAt(records: UsedBenefitRecord[], key: string) {
  return records.find((record) => record.key === key)?.usedAt;
}

function RewardActionRow({
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress
}: {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
}) {
  return (
    <View style={styles.rewardActionRow}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.86} style={[styles.rewardActionButton, styles.rewardPrimaryAction]} onPress={onPrimaryPress}>
        <Text style={[styles.rewardActionText, styles.rewardPrimaryActionText]} numberOfLines={1}>{primaryLabel}</Text>
      </TouchableOpacity>
      {secondaryLabel && onSecondaryPress ? (
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.86} style={[styles.rewardActionButton, styles.rewardSecondaryAction]} onPress={onSecondaryPress}>
          <Text style={[styles.rewardActionText, styles.rewardSecondaryActionText]} numberOfLines={1}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PartnerLocationCard({ offer }: { offer: (typeof partnerOffers)[number] }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} onPress={() => openPartnerMap(offer)}>
      <AppCard style={styles.partnerLocationCard}>
        <View style={styles.partnerLocationIcon}>
          <Ionicons name="location-outline" size={18} color={colors.coffee} />
        </View>
        <View style={styles.partnerLocationCopy}>
          <Text style={styles.partnerLocationTitle} numberOfLines={1}>{offer.partnerName}</Text>
          <Text style={styles.partnerLocationAddress} numberOfLines={2}>{offer.address}</Text>
        </View>
        <View style={styles.partnerLocationAction}>
          <Ionicons name="navigate-outline" size={16} color={colors.coffee} />
          <Text style={styles.partnerLocationActionText}>Navigate</Text>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

function RewardDetailList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <AppCard style={styles.detailList}>
      {rows.map((row, index) => (
        <DetailRow key={row.label} label={row.label} value={row.value} last={index === rows.length - 1} />
      ))}
    </AppCard>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function getAssetStatusTone(status: AssetStatus | RedeemedPointReward["status"]) {
  if (status === "Expired") {
    return "expired";
  }
  if (status === "Used") {
    return "used";
  }
  return "active";
}

function getRewardDetailPalette(tone: "voucher" | "coupon", statusTone: "active" | "used" | "expired") {
  if (statusTone === "expired") {
    return { background: "#7C3A38", accent: "#E6A19A", soft: "rgba(255,255,255,0.16)" };
  }
  if (statusTone === "used") {
    return { background: "#4E5964", accent: "#B8C4CE", soft: "rgba(255,255,255,0.14)" };
  }
  if (tone === "coupon") {
    return { background: "#2E6C8E", accent: "#B8D9EF", soft: "rgba(255,255,255,0.18)" };
  }
  return { background: "#2F6F68", accent: "#9FD8CE", soft: "rgba(255,255,255,0.18)" };
}

function getTimelineStateStyle(state: "done" | "current" | "pending" | "danger") {
  if (state === "done") {
    return { dot: styles.timelineDotDone, line: styles.timelineLineDone, title: styles.timelineTitleDone };
  }
  if (state === "current") {
    return { dot: styles.timelineDotCurrent, line: styles.timelineLineMuted, title: styles.timelineTitleCurrent };
  }
  if (state === "danger") {
    return { dot: styles.timelineDotDanger, line: styles.timelineLineMuted, title: styles.timelineTitleDanger };
  }
  return { dot: styles.timelineDotPending, line: styles.timelineLineMuted, title: styles.timelineTitlePending };
}

function showRewardAction(title: string, message: string) {
  Alert.alert(title, message);
}

function getPartnerAssetRedeemCopy(offer: (typeof partnerOffers)[number]) {
  if (offer.purchaseCategory === "ticket") {
    return "Show this ticket code at entry. The partner validates the code on site.";
  }
  return "Show this voucher when dining in. The partner validates the code on site.";
}

function openPartnerMap(offer: (typeof partnerOffers)[number]) {
  const query = encodeURIComponent(`${offer.partnerName} ${offer.address}`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

function getExpiryLabel(expires: string, status: AssetStatus) {
  if (status === "Expired") {
    return { label: "Expired", urgent: false };
  }
  return { label: `Expires ${expires}`, urgent: isExpiresSoon(expires) };
}

function getCouponExpiryLabel(coupon: (typeof coupons)[number]) {
  if (coupon.status === "Expired") {
    return { label: "Expired", urgent: false };
  }
  return {
    label: coupon.expiringSoon ? `Expires soon · ${coupon.expires}` : `Expires ${coupon.expires}`,
    urgent: coupon.expiringSoon || isExpiresSoon(coupon.expires)
  };
}

function parseCouponExpiresAt(expires: string) {
  const parsedDate = new Date(`${expires} ${new Date().getFullYear()}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCouponSourceLabel(coupon: (typeof coupons)[number]) {
  if (coupon.kind !== "Partner") {
    return `${coupon.kind} · From friend`;
  }
  return coupon.kind;
}

function getCouponAssetStatus(coupon: (typeof coupons)[number], usedBenefitIds: string[] = []): AssetStatus {
  if (coupon.status === "Expired") {
    return "Expired";
  }
  if (usedBenefitIds.includes(createBenefitUsageKey("Coupon", coupon.id))) {
    return "Used";
  }
  if (coupon.status === "Used") {
    return "Used";
  }
  return "Claimed";
}

function getVoucherAssetStatus(voucher: (typeof vouchers)[number], usedBenefitIds: string[] = []): AssetStatus {
  if (voucher.status === "Expired") {
    return "Expired";
  }
  if (usedBenefitIds.includes(createBenefitUsageKey("Voucher", voucher.id))) {
    return "Used";
  }
  return voucher.status;
}

function getRewardEntryStatus(entry: RewardListEntry, usedBenefitIds: string[]): AssetStatus {
  if (entry.type === "coupon") {
    return getCouponAssetStatus(entry.coupon, usedBenefitIds);
  }
  if (entry.type === "pointReward") {
    return entry.reward.status;
  }
  if (entry.type === "voucher") {
    return getVoucherAssetStatus(entry.voucher, usedBenefitIds);
  }
  return "Active";
}

function isRewardEntryInTab(entry: RewardListEntry, tab: RewardAssetTab) {
  if (tab === "Vouchers") {
    return entry.type === "voucher" || entry.type === "partnerVoucher" || (entry.type === "pointReward" && entry.reward.rewardType === "Voucher");
  }
  return entry.type === "coupon" || (entry.type === "pointReward" && entry.reward.rewardType === "Coupon");
}

function getInitialRewardTab(filter: RewardFilter): RewardAssetTab {
  return filter === "Coupons" ? "Coupons" : "Vouchers";
}

function getInitialStatusFilter(filter: RewardFilter): RewardStatusFilter {
  if (filter === "Expiring Soon" || filter === "Used") {
    return filter;
  }
  return "All";
}

function isRewardEntryExpiringSoon(entry: RewardListEntry) {
  if (entry.type === "coupon") {
    return getCouponExpiryLabel(entry.coupon).urgent;
  }
  if (entry.type === "pointReward") {
    return isExpiresSoon(entry.reward.expiresAt);
  }
  if (entry.type === "partnerVoucher") {
    return isExpiresSoon(entry.offer.validUntil);
  }
  return getExpiryLabel(entry.voucher.expires, entry.voucher.status).urgent;
}

function createBenefitUsageKey(type: "Voucher" | "Coupon" | "Points Reward" | "Member Benefit", id: string) {
  return `${type}:${id}`;
}

function getCouponDetailSignal(coupon: (typeof coupons)[number]) {
  if (coupon.kind !== "Partner") {
    return "From friend";
  }
  return `${coupon.distance} away · ${coupon.claimedCount.toLocaleString("en-US")} claimed`;
}

function isAssetActive(status: AssetStatus) {
  return status === "Active" || status === "Claimed";
}

function sortVoucherEntry(a: VoucherListEntry, b: VoucherListEntry) {
  return sortAssetKeys(getVoucherSortKey(a), getVoucherSortKey(b));
}

function sortCouponEntry(
  a: { coupon: (typeof coupons)[number]; originalIndex: number },
  b: { coupon: (typeof coupons)[number]; originalIndex: number }
) {
  return sortAssetKeys(getCouponSortKey(a), getCouponSortKey(b));
}

function sortRewardEntry(a: RewardListEntry, b: RewardListEntry) {
  return sortAssetKeys(getRewardSortKey(a), getRewardSortKey(b));
}

function getRewardSortKey(entry: RewardListEntry) {
  if (entry.type === "coupon") {
    return getCouponSortKey(entry);
  }
  if (entry.type === "pointReward") {
    return {
      statusRank: getStatusRank(entry.reward.status),
      expiresAt: parseDateToTime(entry.reward.expiresAt),
      acquiredAt: parseDateToTime(entry.reward.date),
      originalIndex: entry.originalIndex
    };
  }
  return getVoucherSortKey(entry);
}

function sortAssetKeys(
  a: { statusRank: number; expiresAt: number; acquiredAt: number; originalIndex: number },
  b: { statusRank: number; expiresAt: number; acquiredAt: number; originalIndex: number }
) {
  if (a.statusRank !== b.statusRank) {
    return a.statusRank - b.statusRank;
  }
  if (a.expiresAt !== b.expiresAt) {
    return a.expiresAt - b.expiresAt;
  }
  if (a.acquiredAt !== b.acquiredAt) {
    return b.acquiredAt - a.acquiredAt;
  }
  return a.originalIndex - b.originalIndex;
}

function getVoucherSortKey(entry: VoucherListEntry) {
  if (entry.type === "partnerVoucher") {
    return {
      statusRank: 0,
      expiresAt: parseDateToTime(entry.offer.validUntil),
      acquiredAt: parseDateToTime(entry.purchase.purchasedAt),
      originalIndex: entry.originalIndex
    };
  }
  return {
    statusRank: getStatusRank(entry.voucher.status),
    expiresAt: parseDateToTime(entry.voucher.expiresAt),
    acquiredAt: Number.MAX_SAFE_INTEGER - entry.originalIndex,
    originalIndex: entry.originalIndex
  };
}

function getCouponSortKey(entry: { coupon: (typeof coupons)[number]; originalIndex: number }) {
  const status = getCouponAssetStatus(entry.coupon);
  return {
    statusRank: getStatusRank(status),
    expiresAt: parseDateToTime(parseCouponExpiresAt(entry.coupon.expires)),
    acquiredAt: Number.MAX_SAFE_INTEGER - entry.originalIndex,
    originalIndex: entry.originalIndex
  };
}

function getStatusRank(status: AssetStatus) {
  if (status === "Active" || status === "Claimed") {
    return 0;
  }
  if (status === "Used") {
    return 1;
  }
  return 2;
}

function parseDateToTime(value: string | undefined) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function isExpiresSoon(expires: string) {
  return expires.includes("Jun") || expires.includes("Jul 0");
}

const styles = StyleSheet.create({
  rewardsHelper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginBottom: 0,
    marginTop: 2
  },
  filterWrap: {
    marginTop: -4
  },
  rewardTabBar: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: colors.tint,
    marginTop: 14
  },
  rewardTab: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 6
  },
  rewardTabActive: {
    backgroundColor: colors.ink
  },
  rewardTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  rewardTabTextActive: {
    color: colors.onDark
  },
  rewardTabCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  rewardTabCountActive: {
    color: colors.onDark
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 2
  },
  assetListCard: {
    paddingVertical: 4,
    marginTop: 14,
    marginBottom: 14
  },
  emptyStateInline: {
    paddingHorizontal: 12,
    paddingVertical: 18
  },
  couponIconDefault: {
    backgroundColor: colors.tint
  },
  voucherIcon: {
    backgroundColor: "#F7E8D5"
  },
  emptyCard: {
    marginBottom: 10
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5
  },
  detailHero: {
    alignItems: "center",
    marginBottom: 12
  },
  rewardDetailHero: {
    minHeight: 248,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth
  },
  rewardDetailGlow: {
    position: "absolute",
    width: 156,
    height: 156,
    right: -56,
    bottom: -62,
    borderRadius: 78
  },
  rewardMetaRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 11,
    borderBottomColor: "rgba(255,255,255,0.22)",
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  rewardMetaItem: {
    flex: 1
  },
  rewardMetaItemRight: {
    alignItems: "flex-end"
  },
  rewardMetaDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  rewardMetaLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 8,
    fontWeight: "900"
  },
  rewardMetaValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  rewardDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14
  },
  rewardDetailTitleGroup: {
    flex: 1
  },
  rewardDetailOccasion: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "900"
  },
  rewardDetailTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 4
  },
  rewardStatusPill: {
    minHeight: 24,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  rewardStatusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  rewardDetailBody: {
    flex: 1,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  detailIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  rewardDetailCopy: {
    flex: 1
  },
  rewardDetailMark: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "left"
  },
  rewardHeroValue: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 0
  },
  detailDescription: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "left",
    marginTop: 5
  },
  rewardHeroNote: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 10
  },
  timelineCard: {
    marginTop: 2,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  timelineTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12
  },
  timelineRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11
  },
  timelineRail: {
    width: 14,
    alignItems: "center",
    alignSelf: "stretch"
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 3,
    borderWidth: 1.5
  },
  timelineLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
    marginBottom: 3
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 11
  },
  timelineStepTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800"
  },
  timelineStepText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 3
  },
  timelineDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  timelineDotCurrent: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  timelineDotPending: {
    backgroundColor: colors.surface,
    borderColor: colors.line
  },
  timelineDotDanger: {
    backgroundColor: colors.berry,
    borderColor: colors.berry
  },
  timelineLineDone: {
    backgroundColor: colors.success
  },
  timelineLineMuted: {
    backgroundColor: colors.line
  },
  timelineTitleDone: {
    color: colors.success
  },
  timelineTitleCurrent: {
    color: colors.blue
  },
  timelineTitlePending: {
    color: colors.muted
  },
  timelineTitleDanger: {
    color: colors.berry
  },
  rewardActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12
  },
  rewardNotice: {
    marginBottom: 12
  },
  rewardActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  rewardPrimaryAction: {
    backgroundColor: colors.ink
  },
  rewardSecondaryAction: {
    backgroundColor: colors.tint
  },
  rewardActionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800"
  },
  rewardPrimaryActionText: {
    color: colors.surface
  },
  rewardSecondaryActionText: {
    color: colors.ink
  },
  partnerLocationCard: {
    marginTop: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11
  },
  partnerLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  partnerLocationCopy: {
    flex: 1,
    minWidth: 0
  },
  partnerLocationTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800"
  },
  partnerLocationAddress: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 3
  },
  partnerLocationAction: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  partnerLocationActionText: {
    color: colors.coffee,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  detailList: {
    paddingVertical: 0
  },
  detailRow: {
    minHeight: 58,
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
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  detailValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "right"
  }
});
