import { useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { FilterPills } from "../components/FilterPills";
import { InfoListItem } from "../components/InfoListItem";
import { RecordListItem } from "../components/RecordListItem";
import { Screen } from "../components/Screen";
import { colors, statusColors } from "../theme";
import { productCopy } from "../productCopy";
import { getTierByExp } from "../tiers";
import { getTierVisual, TierVisual } from "../tierVisuals";
import { BonusSummary } from "../bonusSummary";
import { GiftRecord, OrderRecord, PaymentHistoryRecord, WalletBalances, WalletHistoryRecord } from "../types";
import { OrderDetailScreen } from "./OrderDetailScreen";
import { AppToastMessage } from "../feedback";

export type ActivityTab = "Orders" | "Payments" | "Wallet";
type OrderFilter = "All" | "Prepaid" | "VM" | "Expired";
type PaymentFilter = "All" | "Wallet eCard" | "Apple Pay" | "Google Pay" | "PayPal" | "Credit Card";
type WalletFilter = "All" | "Top Up" | "Rewards Bonus" | "Payment" | "Refund";
type GiftDirectionTab = "Sent" | "Received";
type GiftFilter = "All" | "Claimed" | "Expired";
type GiftActivityDirection = "Sent" | "Received";
type GiftActivityRecord = GiftRecord & {
  direction: GiftActivityDirection;
};

const activityTabs: Array<{ key: ActivityTab; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "Orders", icon: "receipt-outline" },
  { key: "Payments", icon: "card-outline" },
  { key: "Wallet", icon: "wallet-outline" }
];
const paymentFilters: PaymentFilter[] = ["All", "Wallet eCard", "Apple Pay", "Google Pay", "PayPal", "Credit Card"];
const walletFilters: WalletFilter[] = ["All", "Top Up", "Rewards Bonus", "Payment", "Refund"];
const giftDirectionTabs: Array<{ key: GiftDirectionTab; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "Sent", icon: "gift-outline" },
  { key: "Received", icon: "mail-open-outline" }
];
const giftFilters: GiftFilter[] = ["All", "Claimed", "Expired"];

type WalletDisplayRecord = WalletHistoryRecord & {
  displayAccount?: string;
  displayIconAccount?: WalletHistoryRecord["account"];
  displayStatus?: WalletRecordStatus;
};

type WalletRecordStatus = "Credited" | "Debited" | "Refunded" | "Expired Credit" | "Pending" | "Failed" | "Reversed";
type RecordInlineStatus = {
  label: string;
  showInline: boolean;
  container: object;
  text: object;
};

type ActivityScreenProps = {
  initialTab?: ActivityTab;
  initialReadyOnly?: boolean;
  walletBalance: number;
  walletBalances: WalletBalances;
  bonusSummary: BonusSummary;
  xpBalance: number;
  orders: OrderRecord[];
  paymentHistory: PaymentHistoryRecord[];
  walletHistory: WalletHistoryRecord[];
  onBack: () => void;
};

export function ActivityScreen({
  initialTab = "Orders",
  initialReadyOnly = false,
  walletBalance,
  walletBalances,
  bonusSummary,
  xpBalance,
  orders,
  paymentHistory,
  walletHistory,
  onBack
}: ActivityScreenProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>(initialReadyOnly ? "Prepaid" : "All");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [walletFilter, setWalletFilter] = useState<WalletFilter>("All");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const activeOrder = orders.find((order) => order.id === activeOrderId);
  const activePayment = paymentHistory.find((payment) => payment.id === activePaymentId);
  const walletDisplayHistory = mergeWalletPaymentRecords(walletHistory);
  const activeWalletRecord = walletDisplayHistory.find((record) => record.id === activeWalletId);
  const visibleOrders = filterOrders(orders, orderFilter);
  const tierVisual = getTierVisual(getTierByExp(xpBalance));

  if (activeOrder) {
    return <OrderDetailScreen order={activeOrder} onBack={() => setActiveOrderId(null)} />;
  }
  if (activePayment) {
    return <PaymentDetailScreen payment={activePayment} onBack={() => setActivePaymentId(null)} />;
  }
  if (activeWalletRecord) {
    return <WalletDetailScreen record={activeWalletRecord} onBack={() => setActiveWalletId(null)} />;
  }

  return (
    <Screen
      title="Transactions"
      eyebrow="Orders, payments and wallet"
      scrollKey={`activity-${activeTab}`}
      onBack={onBack}
      backLabel="Back to Account"
    >
      <View style={styles.tabBar}>
        {activityTabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon} size={18} color={active ? colors.onDark : colors.muted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "Orders" ? (
        <OrdersPanel
          orders={visibleOrders}
          paymentHistory={paymentHistory}
          totalOrders={orders.length}
          prepaidCount={filterOrders(orders, "Prepaid").length}
          vmCount={filterOrders(orders, "VM").length}
          expiredCount={orders.filter((order) => order.status === "Expired").length}
          activeFilter={orderFilter}
          onChangeFilter={setOrderFilter}
          onOpenOrder={setActiveOrderId}
        />
      ) : null}
      {activeTab === "Payments" ? (
        <PaymentsPanel
          history={paymentHistory}
          activeFilter={paymentFilter}
          onChangeFilter={setPaymentFilter}
          onOpenPayment={setActivePaymentId}
        />
      ) : null}
      {activeTab === "Wallet" ? (
        <WalletPanel
          walletBalance={walletBalance}
          walletBalances={walletBalances}
          bonusSummary={bonusSummary}
          tierVisual={tierVisual}
          history={walletHistory}
          activeFilter={walletFilter}
          onChangeFilter={setWalletFilter}
          onOpenWallet={setActiveWalletId}
        />
      ) : null}
    </Screen>
  );
}

export function GiftHistoryScreen({
  gifts,
  onShowToast,
  onBack
}: {
  gifts: GiftRecord[];
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
  onBack: () => void;
}) {
  const [activeDirection, setActiveDirection] = useState<GiftDirectionTab>("Sent");
  const [giftFilter, setGiftFilter] = useState<GiftFilter>("All");
  const [activeGiftId, setActiveGiftId] = useState<string | null>(null);
  const giftRecords = gifts.map((gift) => ({ ...gift, direction: "Sent" as const }));
  const directionalGifts = giftRecords.filter((gift) => gift.direction === activeDirection);
  const visibleGifts = filterGiftActivityRecords(directionalGifts, giftFilter);
  const activeGift = giftRecords.find((gift) => gift.id === activeGiftId);

  if (activeGift) {
    return <GiftDetailScreen gift={activeGift} onShowToast={onShowToast} onBack={() => setActiveGiftId(null)} />;
  }

  return (
    <Screen
      title="Gift History"
      eyebrow="Sent and received gifts"
      scrollKey="gift-history"
      onBack={onBack}
      backLabel="Back to Gift"
    >
      <View style={styles.tabBar}>
        {giftDirectionTabs.map((tab) => {
          const active = activeDirection === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                setActiveDirection(tab.key);
                setGiftFilter("All");
              }}
            >
              <Ionicons name={tab.icon} size={18} color={active ? colors.onDark : colors.muted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <GiftsPanel
        gifts={visibleGifts}
        allGifts={directionalGifts}
        activeFilter={giftFilter}
        onChangeFilter={setGiftFilter}
        onOpenGift={(giftId) => setActiveGiftId(giftId)}
      />
    </Screen>
  );
}

function GiftDetailScreen({
  gift,
  onShowToast,
  onBack
}: {
  gift: GiftActivityRecord;
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
  onBack: () => void;
}) {
  const palette = getGiftDetailPalette(gift.occasion);
  const statusMeta = getGiftDetailStatusMeta(gift.status);
  const giftType = gift.kind === "voucher" ? "Drink Voucher" : "Wallet eCard";

  return (
    <Screen
      title="Gift Detail"
      eyebrow={gift.direction === "Sent" ? "Sent gift" : "Received gift"}
      scrollKey={`gift-detail-${gift.id}`}
      onBack={onBack}
      backLabel="Gift History"
    >
      <View style={[styles.giftDetailHero, { backgroundColor: palette.background, borderColor: palette.accent }]}>
        <View style={[styles.giftDetailGlow, { backgroundColor: palette.soft }]} />
        <View style={styles.giftDetailMetaRow}>
          <View style={styles.giftDetailMetaItem}>
            <Text style={styles.giftDetailMetaLabel}>GIFT TYPE</Text>
            <Text style={styles.giftDetailMetaValue} numberOfLines={1}>{giftType}</Text>
          </View>
          <View style={styles.giftDetailMetaDivider} />
          <View style={[styles.giftDetailMetaItem, styles.giftDetailMetaItemRight]}>
            <Text style={styles.giftDetailMetaLabel}>GIFT CODE</Text>
            <Text style={styles.giftDetailMetaValue} numberOfLines={1}>{gift.giftCode}</Text>
          </View>
        </View>
        <View style={styles.giftDetailHeader}>
          <View style={styles.giftDetailTitleGroup}>
            <Text style={styles.giftDetailOccasion}>{gift.occasion.toUpperCase()}</Text>
            <Text style={styles.giftDetailTitle} numberOfLines={2}>{gift.title}</Text>
          </View>
          <View style={[styles.giftDetailStatus, { backgroundColor: statusMeta.background }]}>
            <Text style={[styles.giftDetailStatusText, { color: statusMeta.color }]}>{gift.status}</Text>
          </View>
        </View>
        <View style={styles.giftDetailBody}>
          <View style={styles.giftDetailCopy}>
            <Text style={styles.giftDetailRecipient} numberOfLines={1}>
              {gift.direction === "Sent" ? `To ${gift.recipientName}` : `From ${gift.recipientName}`}
            </Text>
            <Text style={styles.giftDetailContact} numberOfLines={1}>{gift.recipientContact}</Text>
            <Text style={styles.giftDetailMessage} numberOfLines={3}>
              “{gift.message || "Enjoy your gift!"}”
            </Text>
          </View>
          <View style={styles.giftDetailMark}>
            <Ionicons name={gift.kind === "voucher" ? "ticket-outline" : "wallet-outline"} size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <GiftStatusTimeline gift={gift} />
      <GiftDetailActions gift={gift} onShowToast={onShowToast} />
    </Screen>
  );
}

type TimelineStepState = "done" | "current" | "pending" | "danger";

type TimelineStep = {
  title: string;
  text: string;
  state: TimelineStepState;
};

function GiftStatusTimeline({ gift }: { gift: GiftActivityRecord }) {
  const steps = getGiftTimelineSteps(gift);

  return (
    <AppCard style={styles.timelineCard}>
      <Text style={styles.timelineTitle}>Status Timeline</Text>
      <View style={styles.timelineList}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const stateStyle = getTimelineStateStyle(step.state);
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

function GiftDetailActions({
  gift,
  onShowToast
}: {
  gift: GiftActivityRecord;
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
}) {
  const actions = getGiftDetailActions(gift);

  return (
    <View style={styles.giftActionRow}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={action.label}
          style={[styles.giftActionButton, index === 0 ? styles.giftActionPrimary : styles.giftActionSecondary]}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => handleGiftDetailAction(action.action, gift, onShowToast)}
        >
          <Ionicons name={action.icon} size={16} color={index === 0 ? colors.onDark : colors.ink} />
          <Text style={[styles.giftActionText, index === 0 ? styles.giftActionTextPrimary : styles.giftActionTextSecondary]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function OrdersPanel({
  orders,
  paymentHistory,
  totalOrders,
  prepaidCount,
  vmCount,
  expiredCount,
  activeFilter,
  onChangeFilter,
  onOpenOrder
}: {
  orders: OrderRecord[];
  paymentHistory: PaymentHistoryRecord[];
  totalOrders: number;
  prepaidCount: number;
  vmCount: number;
  expiredCount: number;
  activeFilter: OrderFilter;
  onChangeFilter: (filter: OrderFilter) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  return (
    <>
      <Text style={styles.panelDescription}>
        Orders paid with your Wallet eCard at a VM and prepaid orders placed in the app both appear here.
      </Text>
      <FilterPills
        activeValue={activeFilter}
        onChange={onChangeFilter}
        options={[
          { value: "All", icon: "list-outline", count: totalOrders },
          { value: "Prepaid", icon: "ticket-outline", count: prepaidCount },
          { value: "VM", icon: "qr-code-outline", count: vmCount },
          { value: "Expired", icon: "alert-circle-outline", count: expiredCount }
        ]}
      />
      {orders.length ? (
        <AppCard style={styles.listCard}>
          {orders.map((order, index) => {
            const isPreOrder = order.orderMode === "app_preorder";
            const orderStatus = getOrderRecordStatus(order);
            const paymentId = getOrderPaymentId(paymentHistory, order.orderNumber);
            const orderMeta = order.machineName
              ? order.machineName
              : isPreOrder
                ? undefined
                : "Use at a compatible VM · Not bound yet";

            return (
              <RecordListItem
                key={order.id}
                leading={{ type: "icon", icon: isPreOrder ? "ticket-outline" : "qr-code-outline" }}
                title={order.title}
                primary={`${order.itemCount} item${order.itemCount > 1 ? "s" : ""} ${isPreOrder ? "prepaid" : "pay at VM"} · ${order.orderNumber}`}
                secondary={orderMeta}
                datetime={formatActivityDate(order.date)}
                recordId={paymentId}
                trailing={isPreOrder && order.status === "Ready to collect"
                  ? {
                      type: "countdown",
                      expiresAt: order.pickupExpiresAtEpoch,
                      bottomLabel: order.amount,
                      bottomTone: "neutral"
                    }
                  : {
                      type: "custom",
                      node: (
                        <RecordAmountTrailing
                          amount={order.amount}
                          amountColor={colors.ink}
                          status={orderStatus.showInline ? orderStatus : undefined}
                          statusTextOnly
                        />
                      )
                    }}
                last={index === orders.length - 1}
                onPress={() => onOpenOrder(order.id)}
              />
            );
          })}
        </AppCard>
      ) : (
        <ActivityEmptyState
          icon="receipt-outline"
          title="No orders found"
          text="Prepaid and VM order activity will appear here."
        />
      )}
    </>
  );
}

function PaymentsPanel({
  history,
  activeFilter,
  onChangeFilter,
  onOpenPayment
}: {
  history: PaymentHistoryRecord[];
  activeFilter: PaymentFilter;
  onChangeFilter: (filter: PaymentFilter) => void;
  onOpenPayment: (paymentId: string) => void;
}) {
  const records =
    activeFilter === "All"
      ? history
      : history.filter((transaction) => transaction.method === activeFilter);

  return (
    <>
      <Text style={styles.panelDescription}>Charges, added funds, and refunds across every payment method.</Text>
      <FilterPills
        activeValue={activeFilter}
        onChange={onChangeFilter}
        options={paymentFilters.map((filter) => ({
          value: filter,
          icon: getMethodIcon(filter),
          count:
            filter === "All"
              ? history.length
              : history.filter((transaction) => transaction.method === filter).length
        }))}
      />
      {records.length ? (
        <AppCard style={styles.listCard}>
          {records.map((transaction, index) => {
            const positive = transaction.amount > 0;
            const paymentStatus = getPaymentRecordStatus(transaction.status);
            return (
              <RecordListItem
                key={transaction.id}
                leading={{ type: "icon", icon: getMethodIcon(transaction.method) }}
                title={transaction.title}
                datetime={formatActivityDate(transaction.date)}
                recordId={transaction.transactionId}
                secondary={transaction.description}
                last={index === records.length - 1}
                trailing={{
                  type: "custom",
                  node: (
                    <RecordAmountTrailing
                      amount={`${positive ? "+" : "-"}${formatCurrency(Math.abs(transaction.amount))}`}
                      amountColor={getPaymentAmountColor(transaction.type)}
                      status={paymentStatus.showInline ? paymentStatus : undefined}
                    />
                  )
                }}
                onPress={() => onOpenPayment(transaction.id)}
              />
            );
          })}
        </AppCard>
      ) : (
        <ActivityEmptyState
          icon="card-outline"
          title="No payments found"
          text="Payment charges, refunds, and add funds activity will appear here."
        />
      )}
    </>
  );
}

function WalletPanel({
  walletBalance,
  walletBalances,
  bonusSummary,
  tierVisual,
  history,
  activeFilter,
  onChangeFilter,
  onOpenWallet
}: {
  walletBalance: number;
  walletBalances: WalletBalances;
  bonusSummary: BonusSummary;
  tierVisual: TierVisual;
  history: WalletHistoryRecord[];
  activeFilter: WalletFilter;
  onChangeFilter: (filter: WalletFilter) => void;
  onOpenWallet: (recordId: string) => void;
}) {
  const displayHistory = mergeWalletPaymentRecords(history);
  const records =
    activeFilter === "All"
      ? displayHistory
      : displayHistory.filter((record) =>
          activeFilter === "Rewards Bonus"
            ? record.type === "Rewards Bonus"
            : record.type === activeFilter
        );

  return (
    <>
      <AppCard
        style={[
          styles.walletSummary,
          {
            backgroundColor: tierVisual.background,
            borderColor: tierVisual.border
          }
        ]}
      >
        <View>
          <Text style={[styles.walletLabel, { color: tierVisual.mutedText }]}>Available Balance</Text>
          <Text style={[styles.walletValue, { color: tierVisual.primaryText }]}>{formatCurrency(walletBalance)}</Text>
          <Text style={[styles.walletBreakdown, { color: tierVisual.mutedText }]}>
            Cash {formatCurrency(walletBalances.cash)} · Bonus {formatCurrency(walletBalances.rewardsBonus)}
          </Text>
          <Text style={[styles.walletBonusSummary, { color: tierVisual.mutedText }]}>
            Bonus earned {formatCurrency(bonusSummary.earned)} · {formatCurrency(bonusSummary.used)} used
          </Text>
        </View>
        <Text style={[styles.walletNote, { color: tierVisual.accent, backgroundColor: tierVisual.tileBackground }]}>Wallet changes only</Text>
      </AppCard>
      <FilterPills
        activeValue={activeFilter}
        onChange={onChangeFilter}
        options={walletFilters.map((filter) => ({
          value: filter,
          label: filter === "Top Up" ? "Add Funds" : filter === "Rewards Bonus" ? "Bonus" : filter,
          icon: getWalletIcon(filter),
          count:
            filter === "All"
              ? displayHistory.length
              : displayHistory.filter((record) =>
                  filter === "Rewards Bonus"
                    ? record.type === "Rewards Bonus"
                    : record.type === filter
                ).length
        }))}
      />
      {records.length ? (
        <AppCard style={styles.listCard}>
          {records.map((record, index) => {
            const positive = record.amount > 0;
            const walletStatus = getWalletRecordStatus(record);
            return (
              <RecordListItem
                key={record.id}
                leading={{ type: "icon", icon: getWalletRecordIcon(record) }}
                title={formatFundingCopy(record.title)}
                datetime={formatActivityDate(record.date)}
                recordId={record.transactionId}
                secondary={getWalletRecordMeta(record)}
                last={index === records.length - 1}
                trailing={{
                  type: "custom",
                  node: (
                    <RecordAmountTrailing
                      amount={`${positive ? "+" : "-"}${formatCurrency(Math.abs(record.amount))}`}
                      amountColor={getWalletAmountColor(record.type)}
                      status={walletStatus.showInline ? walletStatus : undefined}
                      statusTextOnly
                    />
                  )
                }}
                onPress={() => onOpenWallet(record.id)}
              />
            );
          })}
        </AppCard>
      ) : (
        <ActivityEmptyState
          icon="wallet-outline"
          title="No wallet activity found"
          text="Wallet balance changes and bonus activity will appear here."
        />
      )}
    </>
  );
}

function GiftsPanel({
  gifts,
  allGifts,
  activeFilter,
  onChangeFilter,
  onOpenGift
}: {
  gifts: GiftActivityRecord[];
  allGifts: GiftActivityRecord[];
  activeFilter: GiftFilter;
  onChangeFilter: (filter: GiftFilter) => void;
  onOpenGift: (giftId: string) => void;
}) {
  return (
    <>
      <Text style={styles.panelDescription}>
        Gifts you sent and received, including drink vouchers and Wallet eCards.
      </Text>
      <FilterPills
        activeValue={activeFilter}
        onChange={onChangeFilter}
        options={giftFilters.map((filter) => ({
          value: filter,
          icon: getGiftFilterIcon(filter),
          count: filterGiftActivityRecords(allGifts, filter).length
        }))}
      />
      {gifts.length ? (
        <AppCard style={styles.listCard}>
          {gifts.map((gift, index) => (
            <RecordListItem
              key={gift.id}
              leading={{
                type: "icon",
                icon: gift.kind === "voucher" ? "ticket-outline" : "wallet-outline",
                tone: "warning",
                color: colors.coffee
              }}
              title={gift.title}
              secondary={`${gift.direction} ${gift.direction === "Sent" ? "to" : "from"} ${gift.recipientName} · ${gift.kind === "voucher" ? "Drink Voucher" : "Wallet eCard"}`}
              source={gift.occasion}
              datetime={formatActivityDate(gift.date)}
              recordId={gift.giftCode}
              onPress={() => onOpenGift(gift.id)}
              last={index === gifts.length - 1}
            />
          ))}
        </AppCard>
      ) : (
        <ActivityEmptyState
          icon="gift-outline"
          title="No gifts found"
          text="Sent and received gift activity will appear here."
        />
      )}
    </>
  );
}

function ActivityEmptyState({
  icon,
  title,
  text
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <AppCard style={styles.emptyCard}>
      <Ionicons name={icon} size={26} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </AppCard>
  );
}

function PaymentDetailScreen({ payment, onBack }: { payment: PaymentHistoryRecord; onBack: () => void }) {
  const positive = payment.amount > 0;
  const amount = `${positive ? "+" : "-"}${formatCurrency(Math.abs(payment.amount))}`;
  const palette = getTransactionHeroPalette(payment.status === "Failed" ? "danger" : payment.status === "Pending" ? "warning" : payment.status === "Refunded" ? "success" : "payment");

  return (
    <Screen
      title="Payment Detail"
      eyebrow={payment.type}
      scrollKey={`payment-detail-${payment.id}`}
      onBack={onBack}
      backLabel="Transactions"
    >
      <TransactionDetailHero
        palette={palette}
        leftLabel="PAYMENT"
        leftValue={payment.type}
        rightLabel="PAY ID"
        rightValue={payment.transactionId ?? payment.id}
        eyebrow={payment.method}
        title={payment.title}
        status={payment.status}
        amount={amount}
        note={payment.description}
        icon={getMethodIcon(payment.method)}
      />
      <TransactionStatusTimeline
        steps={getPaymentTimelineSteps(payment)}
      />
    </Screen>
  );
}

function WalletDetailScreen({ record, onBack }: { record: WalletDisplayRecord; onBack: () => void }) {
  const positive = record.amount > 0;
  const amount = `${positive ? "+" : "-"}${formatCurrency(Math.abs(record.amount))}`;
  const walletStatus = getWalletRecordStatus(record);
  const palette = getTransactionHeroPalette(record.type === "Refund" ? "success" : record.type === "Payment" ? "walletDebit" : "walletCredit");
  const displayAccount = formatFundingCopy(record.displayAccount ?? record.account ?? "Wallet eCard");

  return (
    <Screen
      title="Wallet Detail"
      eyebrow={displayAccount}
      scrollKey={`wallet-detail-${record.id}`}
      onBack={onBack}
      backLabel="Transactions"
    >
      <TransactionDetailHero
        palette={palette}
        leftLabel="WALLET"
        leftValue={formatFundingCopy(record.type)}
        rightLabel="TXN ID"
        rightValue={record.transactionId ?? record.id}
        eyebrow={displayAccount}
        title={formatFundingCopy(record.title)}
        status={walletStatus.label}
        amount={amount}
        note={getWalletRecordMeta(record)}
        icon={getWalletRecordIcon(record)}
      />
      <TransactionStatusTimeline
        steps={getWalletTimelineSteps(record, walletStatus.label)}
      />
      {walletStatus.label === "Expired Credit" ? (
        <InlineWalletNotice
          icon="time-outline"
          title={`Moved to ${record.creditedTo ?? "Bonus Balance"}`}
          text={`This prepaid order expired before pickup. The paid amount was credited to ${record.creditedTo ?? "Bonus Balance"} and was not refunded as cash.`}
          tone="warning"
        />
      ) : null}
    </Screen>
  );
}

type TransactionTimelineStep = {
  title: string;
  text: string;
  state: TimelineStepState;
};

function TransactionDetailHero({
  palette,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  eyebrow,
  title,
  status,
  amount,
  note,
  icon
}: {
  palette: { background: string; accent: string; soft: string };
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  eyebrow: string;
  title: string;
  status: string;
  amount: string;
  note: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.giftDetailHero, { backgroundColor: palette.background, borderColor: palette.accent }]}>
      <View style={[styles.giftDetailGlow, { backgroundColor: palette.soft }]} />
      <View style={styles.giftDetailMetaRow}>
        <View style={styles.giftDetailMetaItem}>
          <Text style={styles.giftDetailMetaLabel}>{leftLabel}</Text>
          <Text style={styles.giftDetailMetaValue} numberOfLines={1}>{leftValue}</Text>
        </View>
        <View style={styles.giftDetailMetaDivider} />
        <View style={[styles.giftDetailMetaItem, styles.giftDetailMetaItemRight]}>
          <Text style={styles.giftDetailMetaLabel}>{rightLabel}</Text>
          <Text style={styles.giftDetailMetaValue} numberOfLines={1}>{rightValue}</Text>
        </View>
      </View>
      <View style={styles.giftDetailHeader}>
        <View style={styles.giftDetailTitleGroup}>
          <Text style={styles.giftDetailOccasion}>{eyebrow.toUpperCase()}</Text>
          <Text style={styles.giftDetailTitle} numberOfLines={2}>{title}</Text>
        </View>
        <View style={[styles.giftDetailStatus, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
          <Text style={[styles.giftDetailStatusText, { color: "#FFFFFF" }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.giftDetailBody}>
        <View style={styles.giftDetailCopy}>
          <Text style={styles.transactionHeroAmount}>{amount}</Text>
          <Text style={styles.transactionHeroNote} numberOfLines={2}>{note}</Text>
        </View>
        <View style={styles.giftDetailMark}>
          <Ionicons name={icon} size={32} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

function TransactionStatusTimeline({ steps }: { steps: TransactionTimelineStep[] }) {
  return (
    <AppCard style={styles.timelineCard}>
      <Text style={styles.timelineTitle}>Status Timeline</Text>
      <View style={styles.timelineList}>
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

function InlineWalletNotice({
  icon,
  title,
  text,
  tone
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  tone: "warning" | "info" | "danger" | "success";
}) {
  const toneTokens = tone === "warning"
    ? statusColors.warning
    : tone === "danger"
      ? statusColors.danger
      : tone === "success"
        ? statusColors.success
        : statusColors.info;
  return (
    <View style={styles.walletNotice}>
      <View style={[styles.walletNoticeIcon, { backgroundColor: toneTokens.background }]}>
        <Ionicons name={icon} size={17} color={toneTokens.text} />
      </View>
      <View style={styles.walletNoticeCopy}>
        <Text style={styles.walletNoticeTitle}>{title}</Text>
        <Text style={styles.walletNoticeText}>{text}</Text>
      </View>
    </View>
  );
}

function RecordAmountTrailing({
  amount,
  amountColor,
  status,
  statusTextOnly = false
}: {
  amount: string;
  amountColor: string;
  status?: RecordInlineStatus;
  statusTextOnly?: boolean;
}) {
  return (
    <View style={styles.recordAmountTrailing}>
      {status ? (
        <View style={statusTextOnly ? styles.recordInlineStatusTextOnly : [styles.recordInlineStatus, status.container]}>
          <Text style={[styles.recordInlineStatusText, statusTextOnly && styles.recordInlineStatusTextDirect, status.text]} numberOfLines={1}>
            {status.label}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.amount, styles.recordCenteredAmount, { color: amountColor }]}>{amount}</Text>
    </View>
  );
}

function mergeWalletPaymentRecords(history: WalletHistoryRecord[]): WalletDisplayRecord[] {
  const records: WalletDisplayRecord[] = [];
  const consumedIds = new Set<string>();

  history.forEach((record) => {
    if (consumedIds.has(record.id)) {
      return;
    }

    const group = record.transactionId
      ? history.filter((candidate) =>
          candidate.transactionId === record.transactionId &&
          candidate.type === "Payment" &&
          candidate.date === record.date
        )
      : [record];
    const cashRecord = group.find((candidate) => candidate.account === "Cash");
    const bonusRecord = group.find((candidate) => candidate.account === "Rewards Bonus");

    const addFundsGroup = record.transactionId
      ? history.filter((candidate) =>
          candidate.transactionId === record.transactionId &&
          candidate.date === record.date &&
          (candidate.type === "Top Up" || candidate.type === "Rewards Bonus")
        )
      : [record];
    const addFundsCashRecord = addFundsGroup.find((candidate) => candidate.type === "Top Up" && candidate.account === "Cash");
    const addFundsBonusRecord = addFundsGroup.find((candidate) => candidate.type === "Rewards Bonus" && candidate.account === "Rewards Bonus");

    if ((record.type === "Top Up" || record.type === "Rewards Bonus") && addFundsCashRecord && addFundsBonusRecord) {
      addFundsGroup.forEach((candidate) => consumedIds.add(candidate.id));
      const totalAmount = addFundsGroup.reduce((sum, candidate) => sum + candidate.amount, 0);
      const balanceAfter = Math.max(...addFundsGroup.map((candidate) => candidate.balanceAfter));
      records.push({
        ...addFundsCashRecord,
        id: addFundsGroup.map((candidate) => candidate.id).join(":"),
        title: "Add Funds",
        description: `eCard +${formatCurrency(Math.abs(addFundsCashRecord.amount))} · Bonus +${formatCurrency(Math.abs(addFundsBonusRecord.amount))}`,
        amount: totalAmount,
        balanceAfter,
        account: undefined,
        displayAccount: "Wallet eCard",
        displayIconAccount: "Cash",
        displayStatus: "Credited"
      });
      return;
    }

    if (record.type === "Payment" && cashRecord && bonusRecord) {
      group.forEach((candidate) => consumedIds.add(candidate.id));
      const totalAmount = group.reduce((sum, candidate) => sum + candidate.amount, 0);
      const balanceAfter = Math.min(...group.map((candidate) => candidate.balanceAfter));
      records.push({
        ...record,
        id: group.map((candidate) => candidate.id).join(":"),
        title: getSharedWalletPaymentSubject(group),
        description: `eCard -${formatCurrency(Math.abs(cashRecord.amount))} · Bonus -${formatCurrency(Math.abs(bonusRecord.amount))}`,
        amount: totalAmount,
        balanceAfter,
        account: undefined,
        displayAccount: "Wallet eCard",
        displayIconAccount: "Cash",
        displayStatus: "Debited"
      });
      return;
    }

    if (record.type === "Payment") {
      records.push({
        ...record,
        title: getSharedWalletPaymentSubject([record]),
        description: getWalletPaymentFundingMeta(record),
        displayAccount: "Wallet eCard",
        displayIconAccount: record.account === "Rewards Bonus" ? "Rewards Bonus" : "Cash",
        displayStatus: "Debited"
      });
      return;
    }

    records.push(record);
  });

  return records;
}

function getWalletRecordMeta(record: WalletDisplayRecord) {
  const description = formatFundingCopy(record.description);
  if (record.type === "Payment") {
    return description;
  }
  if (record.type === "Top Up") {
    return description.includes("· Bonus") || description.startsWith("Cash +")
      ? description
      : `eCard ${formatCurrency(Math.abs(record.amount))}`;
  }
  if (record.type === "Rewards Bonus") {
    return record.account === "Rewards Bonus"
      ? `Bonus ${record.amount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(record.amount))}`
      : description;
  }
  return description;
}

function getWalletPaymentFundingMeta(record: WalletHistoryRecord) {
  if (record.account === "Rewards Bonus") {
    return `Bonus ${record.amount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(record.amount))}`;
  }
  return `eCard ${record.amount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(record.amount))}`;
}

function getWalletRecordStatus(record: WalletDisplayRecord) {
  const status = record.displayStatus ?? getDefaultWalletStatus(record);
  if (status === "Refunded") {
    return { label: status, showInline: true, container: styles.statusRefund, text: styles.statusRefundText };
  }
  if (status === "Expired Credit" || status === "Pending") {
    return { label: status, showInline: true, container: styles.statusPending, text: styles.statusPendingText };
  }
  if (status === "Failed" || status === "Reversed") {
    return { label: status, showInline: true, container: styles.statusFailed, text: styles.statusFailedText };
  }
  return { label: status, showInline: false, container: styles.statusReady, text: styles.statusReadyText };
}

function getDefaultWalletStatus(record: WalletDisplayRecord): WalletRecordStatus {
  if (record.type === "Payment") {
    return "Debited";
  }
  if (record.type === "Refund") {
    return "Refunded";
  }
  if (record.type === "Rewards Bonus" && record.title.toLowerCase().includes("expired")) {
    return "Expired Credit";
  }
  return "Credited";
}

function getPaymentRecordStatus(status: PaymentHistoryRecord["status"]): RecordInlineStatus {
  if (status === "Paid" || status === "Completed") {
    return { label: status, showInline: false, container: styles.statusReady, text: styles.statusReadyText };
  }
  if (status === "Refunded") {
    return { label: status, showInline: true, container: styles.statusRefund, text: styles.statusRefundText };
  }
  if (status === "Pending") {
    return { label: status, showInline: true, container: styles.statusPending, text: styles.statusPendingText };
  }
  return { label: status, showInline: true, container: styles.statusFailed, text: styles.statusFailedText };
}

function getOrderRecordStatus(order: OrderRecord): RecordInlineStatus {
  if (order.status === "Ready to collect" || order.status === "Paid" || order.status === "Completed") {
    return { label: order.status, showInline: false, container: styles.statusReady, text: styles.statusReadyText };
  }
  if (order.status === "Refunded") {
    return { label: order.status, showInline: true, container: styles.statusRefund, text: styles.statusRefundText };
  }
  if (order.status === "Awaiting payment" || order.status === "Validating VM" || order.status === "Dispensing" || order.status === "Refunding") {
    return { label: order.status, showInline: true, container: styles.statusPending, text: styles.statusPendingText };
  }
  return { label: order.status, showInline: true, container: styles.statusFailed, text: styles.statusFailedText };
}

function getOrderPaymentId(paymentHistory: PaymentHistoryRecord[], orderNumber: string) {
  return paymentHistory.find((payment) => payment.description.includes(orderNumber))?.transactionId;
}

function filterOrders(orders: OrderRecord[], filter: OrderFilter) {
  switch (filter) {
    case "Prepaid":
      return orders.filter((order) => order.orderMode === "app_preorder" && order.status !== "Expired");
    case "VM":
      return orders.filter((order) => order.orderMode === "vm_app_pay" && order.status !== "Expired");
    case "Expired":
      return orders.filter((order) => order.status === "Expired");
    case "All":
    default:
      return orders;
  }
}

function getSharedWalletPaymentSubject(records: WalletHistoryRecord[]) {
  const description = records.find((record) => !record.description.includes("Rewards Bonus used first"))?.description ?? records[0]?.description ?? "Wallet payment";
  return description.split(" · ")[0] ?? description;
}

function NeutralIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.icon}>
      <Ionicons name={name} size={18} color={colors.muted} />
    </View>
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
      return "list-outline";
  }
}

function getWalletIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "Top Up":
      return "card-outline";
    case "Rewards Bonus":
      return "gift-outline";
    case "Payment":
      return "bag-check-outline";
    case "Refund":
      return "return-up-back-outline";
    default:
      return "list-outline";
  }
}

function getWalletRecordIcon(record: WalletDisplayRecord): keyof typeof Ionicons.glyphMap {
  const account = record.displayIconAccount ?? record.account;
  if (account === "Rewards Bonus") {
    return "gift-outline";
  }
  if (account === "Cash") {
    return "cash-outline";
  }
  return getWalletIcon(record.type);
}

function filterGiftActivityRecords(records: GiftActivityRecord[], filter: GiftFilter) {
  if (filter === "All") {
    return records;
  }
  return records.filter((record) => record.status === filter);
}

function getGiftFilterIcon(filter: GiftFilter): keyof typeof Ionicons.glyphMap {
  switch (filter) {
    case "Claimed":
      return "checkmark-circle-outline";
    case "Expired":
      return "alert-circle-outline";
    default:
      return "gift-outline";
  }
}

function getGiftDetailPalette(occasion: string) {
  switch (occasion) {
    case "Birthday":
      return { background: "#B84A65", accent: "#ECA6B4", soft: "rgba(255,255,255,0.18)" };
    case "Thank You":
      return { background: "#2F6F68", accent: "#9FD8CE", soft: "rgba(255,255,255,0.18)" };
    case "Good Luck":
      return { background: "#6D5BD0", accent: "#C7BFFF", soft: "rgba(255,255,255,0.18)" };
    case "Celebration":
      return { background: "#B45D22", accent: "#F4C28A", soft: "rgba(255,255,255,0.18)" };
    default:
      return { background: "#2E6C8E", accent: "#B8D9EF", soft: "rgba(255,255,255,0.18)" };
  }
}

function getGiftDetailStatusMeta(status: GiftRecord["status"]) {
  if (status === "Claimed") {
    return { background: "rgba(255,255,255,0.22)", color: "#FFFFFF" };
  }
  if (status === "Expired") {
    return { background: "rgba(255,255,255,0.18)", color: "#FFE0E0" };
  }
  return { background: "rgba(255,255,255,0.22)", color: "#FFFFFF" };
}

function getGiftTimelineSteps(gift: GiftActivityRecord): TimelineStep[] {
  if (gift.status === "Claimed") {
    return [
      { title: "Gift Sent", text: formatActivityDate(gift.date), state: "done" },
      { title: "Gift Claimed", text: `${formatActivityDate(gift.claimedAt ?? gift.date)} · ${gift.recipientName} claimed this gift`, state: "done" }
    ];
  }
  if (gift.status === "Expired") {
    return [
      { title: "Gift Sent", text: formatActivityDate(gift.date), state: "done" },
      { title: "Gift Expired", text: `${formatActivityDate(gift.expiresAt)} · This gift can no longer be claimed`, state: "danger" }
    ];
  }
  return [
    { title: "Gift Sent", text: formatActivityDate(gift.date), state: "done" },
    { title: "Waiting to Claim", text: `Expires ${formatActivityDate(gift.expiresAt)} · Waiting for ${gift.recipientName}`, state: "current" },
    { title: "Claimed", text: "Not yet", state: "pending" }
  ];
}

function getPaymentTimelineSteps(payment: PaymentHistoryRecord): TransactionTimelineStep[] {
  const paymentTime = formatActivityDate(payment.date);
  if (payment.status === "Failed") {
    return [
      { title: "Payment Created", text: paymentTime, state: "done" },
      { title: "Payment Failed", text: `${paymentTime} · ${payment.description}`, state: "danger" },
      { title: "Not Completed", text: "No charge was completed", state: "pending" }
    ];
  }
  if (payment.status === "Pending") {
    return [
      { title: "Payment Created", text: paymentTime, state: "done" },
      { title: "Awaiting Confirmation", text: `${paymentTime} · ${payment.description}`, state: "current" },
      { title: "Benefit Pending", text: "Waiting for payment confirmation", state: "pending" }
    ];
  }
  if (payment.status === "Refunded") {
    return [
      { title: "Payment Created", text: paymentTime, state: "done" },
      { title: "Payment Confirmed", text: `${paymentTime} · ${payment.method}`, state: "done" },
      { title: "Refund Completed", text: `${paymentTime} · ${formatCurrency(Math.abs(payment.amount))}`, state: "done" }
    ];
  }
  return [
    { title: "Payment Created", text: paymentTime, state: "done" },
    { title: "Payment Confirmed", text: `${paymentTime} · ${payment.method}`, state: "done" },
    getPaymentOutcomeTimelineStep(payment, paymentTime)
  ];
}

function getPaymentOutcomeTimelineStep(payment: PaymentHistoryRecord, paymentTime: string): TransactionTimelineStep {
  if (payment.type === "Order") {
    return { title: "Order Linked", text: `${paymentTime} · Ready in Transactions`, state: "done" };
  }
  if (payment.type === "Top Up") {
    return { title: "Balance Updated", text: `${paymentTime} · Wallet eCard updated`, state: "done" };
  }
  if (payment.type === "Gift") {
    return { title: "Gift Sent", text: `${paymentTime} · Sent to recipient`, state: "done" };
  }
  if (payment.type === "Partner Offer") {
    return { title: "Offer Issued", text: `${paymentTime} · Added to My Rewards`, state: "done" };
  }
  return { title: "Refund Completed", text: `${paymentTime} · Payment record updated`, state: "done" };
}

function getWalletTimelineSteps(record: WalletDisplayRecord, status: string): TransactionTimelineStep[] {
  const created = { title: "Created", text: formatActivityDate(record.date), state: "done" as const };
  const walletTime = formatActivityDate(record.date);
  if (status === "Expired Credit") {
    const originalOrderNumber = record.relatedOrderNumber ?? getExpiredCreditOrderNumber(record) ?? "Original prepaid order";
    const paidMeta = [
      record.originalPaidAt ? formatActivityDate(record.originalPaidAt) : undefined,
      originalOrderNumber,
      record.originalPaymentMethod
    ].filter(Boolean).join(" · ");
    const creditedTo = record.creditedTo ?? "Bonus Balance";
    return [
      { title: "Prepaid Order Paid", text: paidMeta, state: "done" },
      { title: "Pickup Expired", text: formatActivityDate(record.expiredAt ?? record.date), state: "danger" },
      { title: `Credited to ${creditedTo}`, text: `${formatActivityDate(record.date)} · Balance after ${formatCurrency(record.balanceAfter)}`, state: "done" }
    ];
  }
  if (status === "Failed" || status === "Reversed") {
    return [
      created,
      { title: status, text: `${walletTime} · ${formatFundingCopy(record.description)}`, state: "danger" },
      { title: "Not Completed", text: `${walletTime} · No active wallet change`, state: "pending" }
    ];
  }
  if (status === "Pending") {
    return [
      created,
      { title: "Pending", text: `${walletTime} · ${formatFundingCopy(record.description)}`, state: "current" },
      { title: "Completed", text: "Waiting for wallet confirmation", state: "pending" }
    ];
  }
  return [
    created,
    { title: status, text: `${walletTime} · ${formatFundingCopy(record.description)}`, state: getWalletTimelineState(status) },
    { title: "Balance Updated", text: `${walletTime} · Balance after ${formatCurrency(record.balanceAfter)}`, state: getWalletTimelineState(status) }
  ];
}

function getWalletTimelineState(status: string): TimelineStepState {
  if (status === "Debited" || status === "Credited" || status === "Refunded") {
    return "done";
  }
  return "current";
}

function getExpiredCreditOrderNumber(record: WalletDisplayRecord) {
  const fromDescription = record.description.split(" · ")[0];
  if (fromDescription.startsWith("ORD-")) {
    return fromDescription;
  }
  if (record.transactionId?.startsWith("EXP-ORD-")) {
    return record.transactionId.replace("EXP-", "");
  }
  return undefined;
}

function getTransactionHeroPalette(kind: "payment" | "walletCredit" | "walletDebit" | "success" | "warning" | "danger") {
  switch (kind) {
    case "walletCredit":
      return { background: "#2F6F68", accent: "#9FD8CE", soft: "rgba(255,255,255,0.18)" };
    case "walletDebit":
      return { background: "#5F5A38", accent: "#DED19C", soft: "rgba(255,255,255,0.16)" };
    case "success":
      return { background: "#2F6F68", accent: "#9FD8CE", soft: "rgba(255,255,255,0.18)" };
    case "warning":
      return { background: "#B45D22", accent: "#F4C28A", soft: "rgba(255,255,255,0.18)" };
    case "danger":
      return { background: "#7C3A38", accent: "#E6A19A", soft: "rgba(255,255,255,0.16)" };
    case "payment":
    default:
      return { background: "#2E6C8E", accent: "#B8D9EF", soft: "rgba(255,255,255,0.18)" };
  }
}

function getTimelineStateStyle(state: TimelineStepState) {
  switch (state) {
    case "done":
      return {
        dot: styles.timelineDotDone,
        line: styles.timelineLineDone,
        title: styles.timelineTitleDone
      };
    case "current":
      return {
        dot: styles.timelineDotCurrent,
        line: styles.timelineLineMuted,
        title: styles.timelineTitleCurrent
      };
    case "danger":
      return {
        dot: styles.timelineDotDanger,
        line: styles.timelineLineMuted,
        title: styles.timelineTitleDanger
      };
    default:
      return {
        dot: styles.timelineDotPending,
        line: styles.timelineLineMuted,
        title: styles.timelineTitlePending
      };
  }
}

type GiftDetailActionType = "share" | "copy-code" | "send-again" | "send-new";

function getGiftDetailActions(gift: GiftActivityRecord): Array<{ label: string; icon: keyof typeof Ionicons.glyphMap; action: GiftDetailActionType }> {
  if (gift.status === "Claimed") {
    return [{ label: "Send Again", icon: "gift-outline", action: "send-again" }];
  }
  if (gift.status === "Expired") {
    return [{ label: "Send New Gift", icon: "add-circle-outline", action: "send-new" }];
  }
  return [
    { label: "Share", icon: "share-outline", action: "share" },
    { label: "Copy Code", icon: "copy-outline", action: "copy-code" }
  ];
}

async function handleGiftDetailAction(
  action: GiftDetailActionType,
  gift: GiftActivityRecord,
  onShowToast: (toast: AppToastMessage, duration?: number) => void
) {
  if (action === "share") {
    try {
      await Share.share({
        title: `${productCopy.brandName} Gift`,
        message: createGiftShareMessage(gift)
      });
      onShowToast({
        tone: "success",
        title: "Share sheet opened",
        message: "Choose Messages, WeChat, Email or another app to share this gift.",
        icon: "share-outline"
      });
    } catch {
      onShowToast({
        tone: "error",
        title: "Unable to share",
        message: "Please try again or copy the gift code.",
        icon: "alert-circle-outline"
      });
    }
    return;
  }

  if (action === "copy-code") {
    const copied = await copyGiftCode(gift.giftCode);
    if (copied) {
      onShowToast({
        tone: "success",
        title: "Gift code copied",
        message: gift.giftCode,
        icon: "copy-outline"
      });
      return;
    }
    try {
      await Share.share({ title: "Gift Code", message: gift.giftCode });
      onShowToast({
        tone: "info",
        title: "Gift code ready",
        message: "Use the share sheet to send or copy the code.",
        icon: "copy-outline"
      });
    } catch {
      onShowToast({
        tone: "error",
        title: "Unable to copy",
        message: gift.giftCode,
        icon: "alert-circle-outline"
      });
    }
    return;
  }

  onShowToast({
    tone: "info",
    title: action === "send-again" ? "Send Again" : "Send New Gift",
    message: "Start a new gift from the Gift tab.",
    icon: "gift-outline"
  });
}

function createGiftShareMessage(gift: GiftActivityRecord) {
  const claimLink = `https://ga.app/gift/${encodeURIComponent(gift.giftCode)}`;
  return [
    `${gift.recipientName}, ${gift.direction === "Sent" ? "you have" : "this is"} a ${gift.occasion} gift from ${productCopy.brandName}.`,
    "",
    `Gift: ${gift.title}`,
    `Gift Code: ${gift.giftCode}`,
    `Claim before: ${gift.expiresAt}`,
    "",
    `Open ${productCopy.brandName} to claim:`,
    claimLink
  ].join("\n");
}

async function copyGiftCode(giftCode: string) {
  const clipboard = (globalThis as typeof globalThis & {
    navigator?: { clipboard?: { writeText?: (text: string) => Promise<void> } };
  }).navigator?.clipboard;

  if (!clipboard?.writeText) {
    return false;
  }
  await clipboard.writeText(giftCode);
  return true;
}

function getPaymentAmountColor(type: string) {
  if (type === "Top Up") return colors.blue;
  if (type === "Refund") return colors.success;
  return colors.berry;
}

function getWalletAmountColor(type: string) {
  if (type === "Top Up") return colors.blue;
  if (type === "Rewards Bonus") return colors.milk;
  if (type === "Refund") return colors.success;
  return colors.berry;
}

function formatFundingCopy(value: string) {
  return value
    .replaceAll("Wallet Top Up", "Add Funds")
    .replaceAll("Top Up Bonus", "Add Funds Bonus")
    .replaceAll("Cash Top Up", "Funds Added")
    .replaceAll("Rewards Bonus", "Bonus")
    .replaceAll("Top Up", "Add Funds");
}

function formatActivityDate(value: string) {
  if (value !== "Just now") {
    return value;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: statusColors.neutral.background
  },
  tab: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 6
  },
  tabActive: {
    backgroundColor: colors.ink
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  tabTextActive: {
    color: colors.onDark
  },
  panelDescription: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 14
  },
  listCard: {
    marginTop: 14,
    paddingVertical: 4
  },
  emptyCard: {
    marginTop: 14,
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  emptyText: {
    maxWidth: 240,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4
  },
  giftDetailHero: {
    minHeight: 248,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth
  },
  giftDetailGlow: {
    position: "absolute",
    width: 156,
    height: 156,
    right: -56,
    bottom: -62,
    borderRadius: 78
  },
  giftDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14
  },
  giftDetailTitleGroup: {
    flex: 1
  },
  giftDetailOccasion: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "900"
  },
  giftDetailTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 4
  },
  giftDetailStatus: {
    minHeight: 24,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7
  },
  giftDetailStatusText: {
    fontSize: 10,
    fontWeight: "900"
  },
  giftDetailBody: {
    flex: 1,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  giftDetailCopy: {
    flex: 1
  },
  giftDetailRecipient: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 15,
    fontWeight: "900"
  },
  giftDetailContact: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  giftDetailMessage: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    marginTop: 10
  },
  transactionHeroAmount: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900"
  },
  transactionHeroNote: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 8
  },
  giftDetailMark: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  giftDetailMetaRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 11,
    borderBottomColor: "rgba(255,255,255,0.22)",
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  giftDetailMetaItem: {
    flex: 1
  },
  giftDetailMetaItemRight: {
    alignItems: "flex-end"
  },
  giftDetailMetaDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  giftDetailMetaLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 8,
    fontWeight: "900"
  },
  giftDetailMetaValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  timelineCard: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  timelineTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12
  },
  timelineList: {
    gap: 0
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
  giftActionRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10
  },
  giftActionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth
  },
  giftActionPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  giftActionSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.line
  },
  giftActionText: {
    fontSize: 12,
    fontWeight: "800"
  },
  giftActionTextPrimary: {
    color: colors.onDark
  },
  giftActionTextSecondary: {
    color: colors.ink
  },
  walletNotice: {
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line
  },
  walletNoticeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  walletNoticeCopy: {
    flex: 1
  },
  walletNoticeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  walletNoticeText: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16
  },
  row: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  rowLast: {
    borderBottomWidth: 0
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: statusColors.neutral.background
  },
  copy: {
    flex: 1
  },
  title: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  },
  orderTitle: {
    marginTop: 8
  },
  meta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  statusPill: {
    minHeight: 21,
    paddingHorizontal: 7,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: statusColors.neutral.background,
    borderWidth: StyleSheet.hairlineWidth
  },
  recordAmountTrailing: {
    minWidth: 104,
    minHeight: 48,
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative"
  },
  recordInlineStatus: {
    position: "absolute",
    top: -5,
    right: 0,
    height: 20,
    maxWidth: 104,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: statusColors.neutral.background
  },
  recordInlineStatusText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "right"
  },
  recordInlineStatusTextOnly: {
    position: "absolute",
    top: -5,
    right: 0,
    maxWidth: 104,
    alignItems: "flex-end"
  },
  recordInlineStatusTextDirect: {
    fontVariant: ["tabular-nums"]
  },
  recordCenteredAmount: {
    textAlign: "right"
  },
  statusText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  statusRefund: {
    backgroundColor: statusColors.success.subtleBackground
  },
  statusRefundText: {
    color: colors.success
  },
  statusReady: {
    backgroundColor: statusColors.info.subtleBackground
  },
  statusReadyText: {
    color: colors.blue
  },
  statusPending: {
    backgroundColor: statusColors.warning.subtleBackground
  },
  statusPendingText: {
    color: colors.warning
  },
  statusFailed: {
    backgroundColor: statusColors.danger.background
  },
  statusFailedText: {
    color: colors.berry
  },
  statusDebited: {
    backgroundColor: statusColors.danger.subtleBackground
  },
  statusDebitedText: {
    color: colors.berry
  },
  amount: {
    fontSize: 13,
    fontWeight: "700"
  },
  topUpDetail: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  walletSummary: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.ink
  },
  walletLabel: {
    color: "#D7CEBD",
    fontSize: 12,
    fontWeight: "700"
  },
  walletValue: {
    color: colors.onDark,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4
  },
  walletBreakdown: {
    color: "#D7CEBD",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5
  },
  walletBonusSummary: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4
  },
  walletNote: {
    color: "#F3D18E",
    fontSize: 11,
    fontWeight: "700"
  }
});
