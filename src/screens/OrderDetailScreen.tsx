import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { InfoListItem } from "../components/InfoListItem";
import { InlineNotice } from "../components/InlineNotice";
import { Screen } from "../components/Screen";
import { skus } from "../data/appData";
import { colors, statusColors } from "../theme";
import { OrderRecord } from "../types";
import { getOrderCollectionState } from "../state/appState";
import {
  formatOrderCountdown,
  formatOrderExpiry,
  getExpiryTone,
  getOrderStatusTone
} from "../orderPolicy";

type OrderDetailScreenProps = {
  order: OrderRecord;
  onBack: () => void;
  backLabel?: string;
};

export function OrderDetailScreen({ order, onBack, backLabel = "Back to Orders" }: OrderDetailScreenProps) {
  const isPreOrder = order.orderMode === "app_preorder";
  const [now, setNow] = useState(Date.now());
  const collectionState = getOrderCollectionState(order, now);
  const canCollect = collectionState === "ready";
  const isExpired = collectionState === "expired";
  const expiryTone = getExpiryTone(order.pickupExpiresAtEpoch, now);
  const displayStatus = isExpired ? "Expired" : order.status;
  const statusTone = getOrderStatusTone(displayStatus);
  const orderType = isPreOrder ? "Prepaid Order" : "VM Order";
  const itemModeLabel = isPreOrder ? "prepaid" : "paid at VM";

  useEffect(() => {
    if (!canCollect || !order.pickupExpiresAtEpoch) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [canCollect, order.pickupExpiresAtEpoch]);

  return (
    <Screen
      title="Order Detail"
      eyebrow={`Order ${order.orderNumber}`}
      scrollKey={`order-detail-${order.id}`}
      onBack={onBack}
      backLabel={backLabel}
    >
      <View style={[styles.orderHero, getOrderHeroPalette(displayStatus)]}>
        <View style={styles.orderHeroGlow} />
        <View style={styles.orderHeroMetaRow}>
          <View style={styles.orderHeroMetaItem}>
            <Text style={styles.orderHeroMetaLabel}>ORDER TYPE</Text>
            <Text style={styles.orderHeroMetaValue} numberOfLines={1}>{orderType}</Text>
          </View>
          <View style={styles.orderHeroMetaDivider} />
          <View style={[styles.orderHeroMetaItem, styles.orderHeroMetaItemRight]}>
            <Text style={styles.orderHeroMetaLabel}>ORDER ID</Text>
            <Text style={styles.orderHeroMetaValue} numberOfLines={1}>{order.orderNumber}</Text>
          </View>
        </View>
        <View style={styles.orderHeroHeader}>
          <View style={styles.orderHeroTitleGroup}>
            <Text style={styles.orderHeroEyebrow}>{formatOrderItemCount(order.itemCount)} {itemModeLabel}</Text>
            <Text style={styles.orderHeroTitle} numberOfLines={2}>{order.title}</Text>
          </View>
          <View style={styles.orderHeroStatus}>
            <Text style={styles.orderHeroStatusText}>{displayStatus}</Text>
          </View>
        </View>
        <View style={styles.orderHeroBody}>
          <View style={styles.orderHeroCopy}>
            <Text style={styles.orderHeroAmount}>{order.amount}</Text>
            <Text style={styles.orderHeroNote} numberOfLines={2}>
              {canCollect
                ? "Use the pickup code below at a compatible VM."
                : isExpired
                  ? "This prepaid order can no longer be collected."
                  : `${order.paymentMethod} · ${order.machineName ?? "VM not bound yet"}`}
            </Text>
          </View>
          <View style={styles.orderHeroMark}>
            <Ionicons name={canCollect ? "ticket-outline" : isExpired ? "time-outline" : "receipt-outline"} size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {canCollect && order.pickupCode ? (
        <AppCard style={styles.pickupCard}>
          <View style={styles.pickupHeader}>
            <View>
              <Text style={styles.pickupEyebrow}>PICKUP CODE</Text>
              <Text style={styles.pickupTitle}>Ready to Collect</Text>
            </View>
            <View
              style={[
                styles.pickupCountdownPill,
                { backgroundColor: expiryTone.backgroundColor, borderColor: expiryTone.borderColor }
              ]}
            >
              <Text style={[styles.pickupCountdown, { color: expiryTone.text }]}>
                {formatOrderCountdown(order.pickupExpiresAtEpoch, now, true)}
              </Text>
            </View>
          </View>

          <Text style={styles.pickupCode} selectable>{order.pickupCode}</Text>

          <InlineNotice
            icon="keypad-outline"
            title="Enter This Code at the VM"
            meta="Cloud Verified"
            text="Use the VM keypad. The cloud service verifies the paid order, product support and inventory before dispensing."
            tone="info"
            style={styles.codeInstruction}
          />
        </AppCard>
      ) : null}

      {isExpired ? (
        <InlineNotice
          icon="time-outline"
          title="Pickup Code Expired"
          text="This order cannot be collected. The paid amount has been moved to your Bonus Balance and is not refunded to the original payment method."
          tone="danger"
          style={styles.orderNotice}
        />
      ) : null}

      <OrderStatusTimeline order={order} status={displayStatus} canCollect={canCollect} isExpired={isExpired} now={now} />

      <Text style={styles.sectionTitle}>Order Information</Text>
      <AppCard style={styles.infoCard}>
        {order.items.map((item, index) => (
          <InfoRow
            key={`${item.skuId}-${index}-customization`}
            label={order.items.length === 1 ? "Customization" : `${item.name} customization`}
            value={formatCustomizationSummary(item.customizationSummary, item.skuId)}
          />
        ))}
        <InfoRow
          label="VM"
          value={order.machineName ?? "Not bound yet"}
          accent={!order.machineName}
          last
        />
      </AppCard>

    </Screen>
  );
}

function InfoRow({
  label,
  value,
  accent,
  last
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <InfoListItem
      keyValue
      title={label}
      value={value}
      valueTone={accent ? "accent" : "neutral"}
      style={styles.infoListItem}
      last={last}
    />
  );
}

type OrderTimelineStepState = "done" | "current" | "pending" | "danger";

function OrderStatusTimeline({
  order,
  status,
  canCollect,
  isExpired,
  now
}: {
  order: OrderRecord;
  status: OrderRecord["status"];
  canCollect: boolean;
  isExpired: boolean;
  now: number;
}) {
  const steps = getOrderTimelineSteps(order, status, canCollect, isExpired, now);

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

function getOrderTimelineSteps(
  order: OrderRecord,
  status: OrderRecord["status"],
  canCollect: boolean,
  isExpired: boolean,
  now: number
) {
  const createdAt = order.date;
  const expiryAt = formatOrderExpiry(order.pickupExpiresAtEpoch);
  const paidStep = {
    title: order.status === "Awaiting payment" ? "Awaiting Payment" : "Payment Confirmed",
    text: order.status === "Awaiting payment" ? `${createdAt} · Payment has not been completed` : `${createdAt} · ${order.paymentMethod}`,
    state: order.status === "Awaiting payment" ? "current" as const : "done" as const
  };

  if (isExpired) {
    return [
      { title: "Order Created", text: createdAt, state: "done" as const },
      paidStep,
      { title: "Pickup Expired", text: `${expiryAt} · Pickup window ended`, state: "danger" as const },
      { title: "Credited to Bonus Balance", text: `${expiryAt} · See Wallet for the balance update`, state: "done" as const }
    ];
  }

  if (canCollect) {
    return [
      { title: "Order Created", text: createdAt, state: "done" as const },
      paidStep,
      { title: "Ready to Collect", text: `${expiryAt} · Pickup code active`, state: "current" as const },
      { title: "Completed", text: "Waiting for VM collection", state: "pending" as const }
    ];
  }

  if (status === "Completed") {
    return [
      { title: "Order Created", text: createdAt, state: "done" as const },
      paidStep,
      { title: "Completed", text: `${createdAt} · ${order.machineName ?? "Order completed"}`, state: "done" as const }
    ];
  }

  if (status === "Dispense failed" || status === "Cancelled" || status === "Refunded") {
    return [
      { title: "Order Created", text: createdAt, state: "done" as const },
      paidStep,
      { title: status, text: `${createdAt} · ${order.machineName ?? "Needs support review"}`, state: "danger" as const }
    ];
  }

  return [
    { title: "Order Created", text: createdAt, state: "done" as const },
    paidStep,
    { title: status, text: `${createdAt} · ${order.machineName ?? "Processing order"}`, state: "current" as const }
  ];
}

function getTimelineStateStyle(state: OrderTimelineStepState) {
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

function getOrderHeroPalette(status: OrderRecord["status"]) {
  if (status === "Expired" || status === "Dispense failed" || status === "Cancelled") {
    return { backgroundColor: "#7C3A38", borderColor: "#E6A19A" };
  }
  if (status === "Completed" || status === "Ready to collect") {
    return { backgroundColor: "#2F6F68", borderColor: "#9FD8CE" };
  }
  if (status === "Validating VM") {
    return { backgroundColor: "#2E6C8E", borderColor: "#B8D9EF" };
  }
  return { backgroundColor: "#5F5A38", borderColor: "#DED19C" };
}

function formatOrderItemCount(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

function formatCustomizationSummary(summary: string, skuId?: string) {
  const parts = summary
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  const duplicateCounts = parts.reduce<Record<string, number>>((counts, part) => {
    counts[part] = (counts[part] ?? 0) + 1;
    return counts;
  }, {});
  const sku = skuId ? skus.find((item) => item.id === skuId) : undefined;

  if (!sku || !parts.some((part) => duplicateCounts[part] > 1)) {
    return parts.join(" · ");
  }

  let groupIndex = 0;
  return parts
    .map((part) => {
      const matchedIndex = sku.customizationGroups.findIndex((group, index) => index >= groupIndex && group.options.includes(part));
      if (matchedIndex === -1) {
        return part;
      }
      const group = sku.customizationGroups[matchedIndex];
      groupIndex = matchedIndex + 1;
      return duplicateCounts[part] > 1 ? `${group.title}: ${part}` : part;
    })
    .join(" · ");
}

const styles = StyleSheet.create({
  orderHero: {
    minHeight: 248,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12
  },
  orderHeroGlow: {
    position: "absolute",
    width: 156,
    height: 156,
    right: -56,
    bottom: -62,
    borderRadius: 78,
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  orderHeroMetaRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 11,
    borderBottomColor: "rgba(255,255,255,0.22)",
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  orderHeroMetaItem: {
    flex: 1
  },
  orderHeroMetaItemRight: {
    alignItems: "flex-end"
  },
  orderHeroMetaDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  orderHeroMetaLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 8,
    fontWeight: "900"
  },
  orderHeroMetaValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  orderHeroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14
  },
  orderHeroTitleGroup: {
    flex: 1
  },
  orderHeroEyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  orderHeroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 4
  },
  orderHeroStatus: {
    minHeight: 24,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  orderHeroStatusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  orderHeroBody: {
    flex: 1,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  orderHeroCopy: {
    flex: 1
  },
  orderHeroAmount: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900"
  },
  orderHeroNote: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 8
  },
  orderHeroMark: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  pickupCard: {
    alignItems: "center",
    borderColor: statusColors.info.border,
    backgroundColor: "#F7FBFD",
    marginBottom: 12
  },
  pickupHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  pickupEyebrow: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900"
  },
  pickupTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4
  },
  pickupCountdownPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth
  },
  pickupCountdown: {
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"]
  },
  pickupCode: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 18
  },
  codeInstruction: {
    width: "100%",
    marginTop: 18
  },
  orderNotice: {
    marginBottom: 12
  },
  timelineCard: {
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
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10
  },
  infoCard: {
    paddingVertical: 4
  },
  infoListItem: {
    minHeight: 52
  }
});
