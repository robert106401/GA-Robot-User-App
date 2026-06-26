import { ReactNode, useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, KeyboardTypeOptions, PanResponder, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionTile } from "../components/ActionTile";
import { AppCard } from "../components/AppCard";
import { InfoListItem } from "../components/InfoListItem";
import { getOptionLogoLeading, OptionListItem } from "../components/OptionListItem";
import { RecordListItem } from "../components/RecordListItem";
import { UnusedAssetsCard } from "../components/UnusedAssetsCard";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { memberAssets, partnerOffers } from "../data/appData";
import { getAvailablePaymentMethods, paymentMethods, SavedPaymentCard } from "../paymentMethods";
import { productCopy } from "../productCopy";
import { AppThemeId, colors, spacing, statusColors, themeOptions } from "../theme";
import { getTierProgress } from "../tiers";
import { ActivityTab } from "./ActivityScreen";
import { PaymentMethodSelectionScreen } from "./PaymentMethodSelectionScreen";
import { PaymentHistoryRecord, WalletBalances } from "../types";
import { PaymentMethodId } from "../paymentMethods";
import { AppToastMessage } from "../feedback";
import { AutoReloadSettings, autoReloadAmounts, autoReloadThresholds } from "../autoReload";
import { BonusSummary } from "../bonusSummary";
import type { ProductDisplayArea, ProductDisplayMode, ProductDisplayOverride, ProductDisplayPreferences } from "../state/appState";
import { APP_BUILD_TEXT, APP_SHORT_VERSION_LABEL, APP_VERSION_LABEL, APP_VERSION_TEXT } from "../version";

export type Profile = {
  name: string;
  email: string;
  phone: string;
};

export type PointsRewardOption = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  validDays: number;
  rewardType: "Coupon" | "Voucher";
  icon: keyof typeof Ionicons.glyphMap;
};

const pointsRewardOptions: PointsRewardOption[] = [
  {
    id: "points-coupon-1",
    title: "$1 Coupon",
    description: "Save on your next app order.",
    pointsCost: 600,
    validDays: 7,
    rewardType: "Coupon",
    icon: "ticket-outline"
  },
  {
    id: "points-coupon-2",
    title: "$2 Coupon",
    description: "A bigger discount for your next drink.",
    pointsCost: 1200,
    validDays: 7,
    rewardType: "Coupon",
    icon: "pricetag-outline"
  },
  {
    id: "points-coffee-voucher",
    title: "Coffee Voucher",
    description: "Redeem one eligible coffee at a VM.",
    pointsCost: 1800,
    validDays: 7,
    rewardType: "Voucher",
    icon: "cafe-outline"
  },
  {
    id: "points-milk-tea-voucher",
    title: "Milk Tea Voucher",
    description: "Redeem one eligible milk tea at a VM.",
    pointsCost: 2200,
    validDays: 7,
    rewardType: "Voucher",
    icon: "beer-outline"
  }
];

type MeScreenProps = {
  profile: Profile;
  initialPage?: MePage | null;
  onBack?: () => void;
  backLabel?: string;
  onSaveProfile: (profile: Profile) => void;
  onOpenVouchers: () => void;
  onOpenCoupons: () => void;
  onOpenBenefits: () => void;
  onOpenPartnerOffers: () => void;
  onOpenTier: () => void;
  onOpenMissions: () => void;
  onOpenTopUp: () => void;
  onOpenActivity: (tab: ActivityTab) => void;
  walletBalance: number;
  walletBalances: WalletBalances;
  bonusSummary: BonusSummary;
  autoReloadSettings: AutoReloadSettings;
  onChangeAutoReloadSettings: (settings: AutoReloadSettings) => void;
  pointsBalance: number;
  paymentHistory: PaymentHistoryRecord[];
  xpBalance: number;
  onRedeemPoints: (reward: PointsRewardOption) => void;
  claimedCouponCount: number;
  initialScrollY: number;
  onScrollYChange: (offsetY: number) => void;
  themeId: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
  productDisplayPreferences: ProductDisplayPreferences;
  onSelectProductDisplayDefaultMode: (mode: ProductDisplayMode) => void;
  onSelectProductDisplayPreference: (area: ProductDisplayArea, mode: ProductDisplayOverride) => void;
  defaultPaymentMethod: PaymentMethodId;
  onSetDefaultPaymentMethod: (methodId: PaymentMethodId) => void;
  addedPaymentMethodIds: PaymentMethodId[];
  onSetAddedPaymentMethodIds: (ids: PaymentMethodId[] | ((ids: PaymentMethodId[]) => PaymentMethodId[])) => void;
  savedCards: SavedPaymentCard[];
  onSetSavedCards: (cards: SavedPaymentCard[] | ((cards: SavedPaymentCard[]) => SavedPaymentCard[])) => void;
  currentCardId: string;
  onSetCurrentCardId: (cardId: string) => void;
  systemPaymentMethodIds: PaymentMethodId[];
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
  qaCashierFailureEnabled: boolean;
  onChangeQaCashierFailure: (enabled: boolean) => void;
  pointsInstantRedeemEnabled: boolean;
  onChangePointsInstantRedeem: (enabled: boolean) => void;
  onResetDemoState: () => void;
};

type MePage =
  | "points"
  | "payment-methods"
  | "auto-reload"
  | "partner-benefits"
  | "theme"
  | "product-display"
  | "notification-preferences"
  | "wallet-payments"
  | "account"
  | "about";

export function MeScreen({
  profile,
  initialPage = null,
  onBack,
  backLabel = "Back to Home",
  onSaveProfile,
  onOpenVouchers,
  onOpenCoupons,
  onOpenBenefits,
  onOpenPartnerOffers,
  onOpenTier,
  onOpenMissions,
  onOpenTopUp,
  onOpenActivity,
  walletBalance,
  walletBalances,
  bonusSummary,
  autoReloadSettings,
  onChangeAutoReloadSettings,
  pointsBalance,
  paymentHistory,
  xpBalance,
  onRedeemPoints,
  claimedCouponCount,
  initialScrollY,
  onScrollYChange,
  themeId,
  onSelectTheme,
  productDisplayPreferences,
  onSelectProductDisplayDefaultMode,
  onSelectProductDisplayPreference,
  defaultPaymentMethod,
  onSetDefaultPaymentMethod,
  addedPaymentMethodIds,
  onSetAddedPaymentMethodIds,
  savedCards,
  onSetSavedCards,
  currentCardId,
  onSetCurrentCardId,
  systemPaymentMethodIds,
  onShowToast,
  qaCashierFailureEnabled,
  onChangeQaCashierFailure,
  pointsInstantRedeemEnabled,
  onChangePointsInstantRedeem,
  onResetDemoState
}: MeScreenProps) {
  const [activePage, setActivePage] = useState<MePage | null>(initialPage);
  const [accountReturnPage, setAccountReturnPage] = useState<MePage | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState({
    inboxMessages: true,
    tipping: false,
    receiptsOrders: true,
    offersRewards: true
  });

  useEffect(() => {
    setActivePage(initialPage);
    setAccountReturnPage(null);
  }, [initialPage]);

  const openAccountPage = (page: MePage, returnPage: MePage | null = null) => {
    setAccountReturnPage(returnPage);
    setActivePage(page);
  };

  const closeAccountPage = () => {
    if (accountReturnPage) {
      setActivePage(accountReturnPage);
      setAccountReturnPage(null);
      return;
    }
    setActivePage(null);
  };

  if (activePage === "points") {
    return (
      <PointsScreen
        pointsBalance={pointsBalance}
        paymentHistory={paymentHistory}
        xpBalance={xpBalance}
        onRedeemPoints={onRedeemPoints}
        onBack={() => setActivePage(null)}
      />
    );
  }
  if (activePage === "payment-methods") {
    return (
      <SavedPaymentMethodsScreen
        walletBalance={walletBalance}
        walletBalances={walletBalances}
        defaultPaymentMethod={defaultPaymentMethod}
        onSetDefaultPaymentMethod={onSetDefaultPaymentMethod}
        addedPaymentMethodIds={addedPaymentMethodIds}
        onSetAddedPaymentMethodIds={onSetAddedPaymentMethodIds}
        savedCards={savedCards}
        onSetSavedCards={onSetSavedCards}
        currentCardId={currentCardId}
        onSetCurrentCardId={onSetCurrentCardId}
        systemPaymentMethodIds={systemPaymentMethodIds}
        onShowToast={onShowToast}
        onBack={closeAccountPage}
        backLabel={accountReturnPage === "wallet-payments" ? "Back to Wallet eCard" : "Back to Account"}
      />
    );
  }
  if (activePage === "theme") {
    return (
      <ThemeScreen
        themeId={themeId}
        onSelectTheme={(nextThemeId) => {
          onSelectTheme(nextThemeId);
          onShowToast({
            tone: "success",
            title: "Theme updated",
            message: `${themeOptions.find((theme) => theme.id === nextThemeId)?.label ?? "Theme"} is now active.`,
            icon: "color-palette-outline"
          });
        }}
        onBack={() => setActivePage(null)}
      />
    );
  }
  if (activePage === "product-display") {
    return (
      <ProductDisplayScreen
        preferences={productDisplayPreferences}
        onSelectDefaultMode={(nextMode) => {
          onSelectProductDisplayDefaultMode(nextMode);
          onShowToast({
            tone: "success",
            title: "Default display updated",
            message: `Default list style is now ${nextMode === "row" ? "Rows" : "Cards"}.`,
            icon: nextMode === "row" ? "list-outline" : "grid-outline"
          });
        }}
        onSelectPreference={(area, nextMode) => {
          onSelectProductDisplayPreference(area, nextMode);
          onShowToast({
            tone: "success",
            title: "Product display updated",
            message: `${getProductDisplayAreaLabel(area)} will use ${formatProductDisplayOverride(nextMode).toLowerCase()}.`,
            icon: nextMode === "card" ? "grid-outline" : "list-outline"
          });
        }}
        onBack={() => setActivePage(null)}
      />
    );
  }
  if (activePage === "auto-reload") {
    return (
      <AutoReloadSettingsScreen
        settings={autoReloadSettings}
        onChangeSettings={onChangeAutoReloadSettings}
        onBack={closeAccountPage}
        backLabel={accountReturnPage === "wallet-payments" ? "Back to Wallet eCard" : "Back to Account"}
      />
    );
  }
  if (activePage === "partner-benefits") {
    return (
      <PartnerBenefitsScreen
        claimedCouponCount={claimedCouponCount}
        onBack={() => setActivePage(null)}
        onOpenPartnerOffers={onOpenPartnerOffers}
      />
    );
  }
  if (activePage === "account") {
    return (
      <AccountScreen
        profile={profile}
        onSaveProfile={onSaveProfile}
        onBack={() => setActivePage(null)}
      />
    );
  }
  if (activePage === "about") {
    return <AboutScreen onBack={() => setActivePage(null)} onResetDemoState={onResetDemoState} />;
  }
  if (activePage === "notification-preferences") {
    return (
      <NotificationPreferencesScreen
        preferences={notificationPreferences}
        onChangePreferences={setNotificationPreferences}
        onBack={() => setActivePage(null)}
      />
    );
  }
  if (activePage === "wallet-payments") {
    return (
      <WalletPaymentsScreen
        walletBalance={walletBalance}
        autoReloadSettings={autoReloadSettings}
        defaultPaymentMethod={defaultPaymentMethod}
        savedCards={savedCards}
        currentCardId={currentCardId}
        onOpenTopUp={onOpenTopUp}
        onOpenAutoReload={() => openAccountPage("auto-reload", "wallet-payments")}
        onOpenPaymentMethods={() => openAccountPage("payment-methods", "wallet-payments")}
        onBack={() => setActivePage(null)}
      />
    );
  }

  return (
    <Screen
      title="Account"
      eyebrow="Profile and preferences"
      scrollKey="account-home"
      initialScrollY={initialScrollY}
      onScrollYChange={onScrollYChange}
      onBack={onBack}
      backLabel={backLabel}
    >
      <UnusedAssetsCard
        cardholderName={profile.name}
        walletBalance={walletBalance}
        walletBalances={walletBalances}
        bonusSummary={bonusSummary}
        pointsBalance={pointsBalance}
        xpBalance={xpBalance}
        claimedCouponCount={claimedCouponCount}
        onOpenWallet={() => onOpenActivity("Wallet")}
        onTopUp={onOpenTopUp}
        onOpenVouchers={onOpenVouchers}
        onOpenCoupons={onOpenCoupons}
        onOpenPoints={() => setActivePage("points")}
        onOpenMemberGrowth={onOpenTier}
      />

      <SectionHeader title="Profile" />
      <MenuItem
        icon="person-circle-outline"
        label="Personal Info"
        value={profile.name}
        onPress={() => setActivePage("account")}
      />
      <MenuItem
        icon="wallet-outline"
        label="Wallet eCard & Payments"
        value="Balance and methods"
        onPress={() => openAccountPage("wallet-payments")}
      />
      <MenuItem
        icon="receipt-outline"
        label="Transaction History"
        value="Orders, payments, wallet"
        onPress={() => onOpenActivity("Payments")}
      />
      <MenuItem
        icon="shield-checkmark-outline"
        label="Privacy & Data"
        value="Manage"
      />
      <MenuItem
        icon="finger-print-outline"
        label="Account ID"
        value={formatAccountId()}
      />

      <SectionHeader title="Settings" />
      <MenuItem
        icon="notifications-outline"
        label="Notification Preferences"
        value="Messages and receipts"
        onPress={() => setActivePage("notification-preferences")}
      />
      <MenuItem
        icon="color-palette-outline"
        label="Theme"
        value={themeOptions.find((theme) => theme.id === themeId)?.label ?? "Classic Cream"}
        onPress={() => setActivePage("theme")}
      />
      <MenuItem
        icon="grid-outline"
        label="List Display"
        value="Products & Offers"
        onPress={() => setActivePage("product-display")}
      />
      <MenuItem
        icon="apps-outline"
        label="App Icon"
        value="Default"
      />

      <SectionHeader title="Help & Policies" />
      <MenuItem icon="help-circle-outline" label="Help" value="Support center" />
      <MenuItem icon="shield-outline" label="Privacy Notice" value="Data policy" />

      <SectionHeader title="About" />
      <MenuItem
        icon="information-circle-outline"
        label="About"
        value={`${APP_SHORT_VERSION_LABEL} · ${APP_BUILD_TEXT}`}
        onPress={() => setActivePage("about")}
      />

      <SectionHeader title="Development Tools" />
      <InfoListItem
        contained
        icon="sparkles-outline"
        title="Points Instant Redeem"
        text={pointsInstantRedeemEnabled ? "Can appear as a Benefit" : "Hidden from Benefits"}
        trailing={{
          type: "custom",
          node: (
            <Switch
              value={pointsInstantRedeemEnabled}
              onValueChange={onChangePointsInstantRedeem}
              trackColor={{ false: colors.line, true: statusColors.success.subtleBackground }}
              thumbColor={pointsInstantRedeemEnabled ? colors.success : colors.muted}
            />
          )
        }}
      />
      <InfoListItem
        contained
        icon="bug-outline"
        title="QA Payment Failure"
        text={qaCashierFailureEnabled ? "All Cashier payments will fail" : "Cashier payments use normal flow"}
        trailing={{
          type: "custom",
          node: (
            <Switch
              value={qaCashierFailureEnabled}
              onValueChange={onChangeQaCashierFailure}
              trackColor={{ false: colors.line, true: statusColors.danger.subtleBackground }}
              thumbColor={qaCashierFailureEnabled ? colors.berry : colors.muted}
            />
          )
        }}
      />
      <MenuItem
        icon="refresh-circle-outline"
        label="Reset Demo State"
        value="Restore initial seed data"
        onPress={onResetDemoState}
      />
    </Screen>
  );
}

function ThemeScreen({
  themeId,
  onSelectTheme,
  onBack
}: {
  themeId: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
  onBack: () => void;
}) {
  return (
    <Screen title="Theme" eyebrow="Appearance" scrollKey="theme" onBack={onBack} backLabel="Back to Account">
      <Text style={styles.pageIntro}>Choose the color theme used throughout the app.</Text>
      <View style={styles.themeSelector}>
        {themeOptions.map((theme) => {
          const isSelected = theme.id === themeId;
          const themeIcon = getThemeOptionIcon(theme.id);
          return (
            <OptionListItem
              key={theme.id}
              variant="select"
              selected={isSelected}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: isSelected ? theme.colors.success : theme.colors.line
              }}
              leading={{
                type: "custom",
                node: (
                  <View style={[styles.themeOptionIcon, { backgroundColor: theme.colors.tint }]}>
                    <Ionicons name={themeIcon} size={24} color={theme.colors.coffee} />
                    <View style={styles.themeOptionAccentRow}>
                      <View style={[styles.themeOptionAccent, { backgroundColor: theme.colors.milk }]} />
                      <View style={[styles.themeOptionAccent, { backgroundColor: theme.colors.berry }]} />
                      <View style={[styles.themeOptionAccent, { backgroundColor: theme.colors.blue }]} />
                    </View>
                  </View>
                )
              }}
              title={theme.label}
              text={theme.description}
              onPress={() => onSelectTheme(theme.id)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

function ProductDisplayScreen({
  preferences,
  onSelectDefaultMode,
  onSelectPreference,
  onBack
}: {
  preferences: ProductDisplayPreferences;
  onSelectDefaultMode: (mode: ProductDisplayMode) => void;
  onSelectPreference: (area: ProductDisplayArea, mode: ProductDisplayOverride) => void;
  onBack: () => void;
}) {
  const displayOptions: Array<{
    id: ProductDisplayMode;
    title: string;
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      id: "row",
      title: "Rows",
      text: "Compact rows for fast scanning.",
      icon: "list-outline"
    },
    {
      id: "card",
      title: "Cards",
      text: "Visual cards with larger images or logos.",
      icon: "grid-outline"
    }
  ];
  const sections: Array<{
    area: ProductDisplayArea;
    title: string;
    text: string;
  }> = [
    {
      area: "homeBestSellers",
      title: "Home Best Sellers",
      text: "Home recommendations"
    },
    {
      area: "homePartnerOffers",
      title: "Home Partner Offers",
      text: "Home offer preview"
    },
    {
      area: "orderAllMenu",
      title: "All Order Menu",
      text: "Ordering menu"
    },
    {
      area: "allPartnerOffers",
      title: "All Partner Offers",
      text: "Full offer list"
    }
  ];

  return (
    <Screen title="List Display" eyebrow="Products & Offers" scrollKey="product-display" onBack={onBack} backLabel="Back to Account">
      <Text style={styles.pageIntro}>
        Choose a default list style, then customize only the sections that need a different layout.
      </Text>

      <SectionHeader title="Default Style" />
      <View style={styles.themeSelector}>
        {displayOptions.map((option) => (
          <OptionListItem
            key={option.id}
            variant="select"
            selected={preferences.defaultMode === option.id}
            leading={{
              type: "icon",
              icon: option.icon,
              tone: "info"
            }}
            title={option.title}
            text={option.text}
            onPress={() => onSelectDefaultMode(option.id)}
          />
        ))}
      </View>

      <SectionHeader title="Customize by Section" />
      <View style={styles.themeSelector}>
        {sections.map((section) => (
          <OptionListItem
            key={section.area}
            variant="valueSelect"
            indicator="none"
            leading={{
              type: "icon",
              icon: preferences[section.area] === "card" ? "grid-outline" : "list-outline",
              tone: preferences[section.area] === "default" ? "neutral" : "info"
            }}
            title={section.title}
            text={section.text}
            rightValue={formatProductDisplayOverride(preferences[section.area])}
            density="summary"
            onPress={() => onSelectPreference(section.area, getNextProductDisplayOverride(preferences[section.area]))}
          />
        ))}
      </View>
    </Screen>
  );
}

function AutoReloadSettingsScreen({
  settings,
  onChangeSettings,
  onBack,
  backLabel = "Back to Account"
}: {
  settings: AutoReloadSettings;
  onChangeSettings: (settings: AutoReloadSettings) => void;
  onBack: () => void;
  backLabel?: string;
}) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const visibleHistory = showAllHistory ? autoReloadHistoryRecords : autoReloadHistoryRecords.slice(0, 3);

  return (
    <Screen title="Auto Reload" eyebrow="Wallet eCard" scrollKey="auto-reload-settings" onBack={onBack} backLabel={backLabel}>
      <AppCard style={styles.autoReloadCard}>
        <View style={styles.autoReloadHeader}>
          <View style={styles.autoReloadIcon}>
            <Ionicons name="refresh-outline" size={18} color={colors.success} />
          </View>
          <View style={styles.autoReloadCopy}>
            <Text style={styles.autoReloadTitle}>Auto Reload</Text>
            <Text style={styles.autoReloadText}>
              {settings.enabled
                ? "Funds will be added automatically when Cash Balance falls below your limit."
                : "Turn on to add funds automatically when Cash Balance falls below your limit."}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityState={{ checked: settings.enabled }}
            activeOpacity={0.84}
            style={[styles.autoReloadSwitch, settings.enabled && styles.autoReloadSwitchOn]}
            onPress={() => onChangeSettings({ ...settings, enabled: !settings.enabled })}
          >
            <View style={[styles.autoReloadSwitchKnob, settings.enabled && styles.autoReloadSwitchKnobOn]} />
          </TouchableOpacity>
        </View>

        {settings.enabled ? (
          <View style={styles.autoReloadSettings}>
            <View style={styles.autoReloadSettingGroup}>
              <Text style={styles.autoReloadSettingLabel}>When Cash Balance is below</Text>
              <View style={styles.autoReloadChipRow}>
                {autoReloadThresholds.map((amount) => (
                  <AutoReloadChip
                    key={amount}
                    label={formatWholePaymentAmount(amount)}
                    selected={settings.threshold === amount}
                    onPress={() => onChangeSettings({ ...settings, threshold: amount })}
                  />
                ))}
              </View>
            </View>
            <View style={styles.autoReloadSettingGroup}>
              <Text style={styles.autoReloadSettingLabel}>Automatically add</Text>
              <View style={styles.autoReloadChipRow}>
                {autoReloadAmounts.map((amount) => (
                  <AutoReloadChip
                    key={amount}
                    label={formatWholePaymentAmount(amount)}
                    selected={settings.amount === amount}
                    onPress={() => onChangeSettings({ ...settings, amount })}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.autoReloadFootnote}>
              Uses your selected default payment method. You can change or turn this off anytime.
            </Text>
          </View>
        ) : null}
      </AppCard>

      <SectionHeader
        title="Auto Reload History"
        action={showAllHistory ? "Show Less" : `View All ${autoReloadHistoryRecords.length}`}
        onActionPress={autoReloadHistoryRecords.length > 3 ? () => setShowAllHistory((value) => !value) : undefined}
      />
      {autoReloadHistoryRecords.length ? (
        <AppCard style={styles.autoReloadHistoryCard}>
          {visibleHistory.map((record, index) => (
            <RecordListItem
              key={record.id}
              leading={{ type: "icon", icon: "refresh-outline", tone: "success" }}
              title="Auto Reload"
              secondary={`Cash Balance below ${formatWholePaymentAmount(record.threshold)} · Added ${formatWholePaymentAmount(record.amount)}`}
              source={record.paymentMethod}
              datetime={record.date}
              recordId={record.id}
              trailing={{ type: "amount", value: `+${formatPaymentAmount(record.amount)}`, tone: "success" }}
              last={index === visibleHistory.length - 1}
            />
          ))}
        </AppCard>
      ) : (
        <AppCard style={styles.autoReloadEmptyCard}>
          <Ionicons name="refresh-outline" size={24} color={colors.muted} />
          <Text style={styles.autoReloadEmptyTitle}>No auto reload yet</Text>
          <Text style={styles.autoReloadEmptyText}>Triggered Auto Reload activity will appear here.</Text>
        </AppCard>
      )}
    </Screen>
  );
}

function AutoReloadChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.84}
      style={[styles.autoReloadChip, selected && styles.autoReloadChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.autoReloadChipText, selected && styles.autoReloadChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getThemeOptionIcon(themeId: AppThemeId): keyof typeof Ionicons.glyphMap {
  if (themeId === "vividNature") {
    return "leaf-outline";
  }
  if (themeId === "vibrant") {
    return "sparkles-outline";
  }
  if (themeId === "urbanPulse") {
    return "flash-outline";
  }
  if (themeId === "cupertino") {
    return "phone-portrait-outline";
  }
  return "cafe-outline";
}

function ActivityShortcut({
  icon,
  label,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <ActionTile icon={icon} label={label} compact onPress={onPress} />
  );
}

export function PointsScreen({
  pointsBalance,
  paymentHistory,
  xpBalance,
  onRedeemPoints,
  onBack,
  backLabel = "Back to Account"
}: {
  pointsBalance: number;
  paymentHistory: PaymentHistoryRecord[];
  xpBalance: number;
  onRedeemPoints: (reward: PointsRewardOption) => void;
  onBack: () => void;
  backLabel?: string;
}) {
  const { currentTier } = getTierProgress(xpBalance);
  const pointActivities = paymentHistory.filter((item) => item.points !== 0).slice(0, 8);
  const nextReward = pointsRewardOptions.find((reward) => reward.pointsCost > pointsBalance) ?? pointsRewardOptions[0];
  const pointsToNextReward = Math.max(0, nextReward.pointsCost - pointsBalance);
  const expiringSoonPoints = Math.min(pointsBalance, 120);

  return (
    <Screen
      title="Points"
      eyebrow="Rewards balance"
      scrollKey="points"
      onBack={onBack}
      backLabel={backLabel}
    >
      <AppCard style={styles.pointsHero}>
        <View style={styles.pointsHeroIcon}>
          <Ionicons name="sparkles-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.pointsHeroValue}>{pointsBalance.toLocaleString()}</Text>
        <Text style={styles.pointsHeroLabel}>Available Points</Text>
        <View style={styles.pointsMultiplierPill}>
          <Text style={styles.pointsMultiplierText}>
            {currentTier.name} · {currentTier.pointsPerDollar} Points per $1 spent
          </Text>
        </View>
        <Text style={styles.pointsHeroHint}>
          {pointsToNextReward > 0
            ? `${pointsToNextReward.toLocaleString()} Points to ${nextReward.title}`
            : "You have rewards ready to redeem"}
        </Text>
      </AppCard>

      <AppCard style={styles.pointsExpiryCard}>
        <View style={styles.pointsExpiryIcon}>
          <Ionicons name="time-outline" size={18} color={colors.warning} />
        </View>
        <View style={styles.pointsExpiryCopy}>
          <Text style={styles.pointsExpiryTitle}>{expiringSoonPoints.toLocaleString()} Points Expiring Soon</Text>
          <Text style={styles.pointsExpiryText}>Points expire 12 months after they are earned. EXP is separate and cannot be redeemed.</Text>
        </View>
      </AppCard>

      <SectionHeader title="How Points Work" />
      <SecurityInfoRow
        icon="cafe-outline"
        label="Buy and Pay for Drinks Through the App"
        detail="Earn"
        detailEmphasis={`${currentTier.pointsPerDollar} Points`}
        detailSuffix={`for every $1 spent through the app at ${currentTier.name} tier`}
      />
      <SecurityInfoRow
        icon="gift-outline"
        label="Use Points"
        detail="Redeem points on eligible rewards and offers"
      />
      <SecurityInfoRow
        icon="time-outline"
        label="Points Expire After 12 Months"
        detail="Redeem expiring points before they leave your balance"
      />
      <SecurityInfoRow
        icon="card-outline"
        label="Pay Directly at the VM"
        detail="Direct card payments at the VM earn"
        detailEmphasis="0 Points"
        emphasisTone="danger"
        eligible={false}
      />

      <SectionHeader title="Points Shop" />
      <AppCard style={styles.pointsShopCard}>
        {pointsRewardOptions.map((reward, index) => (
          <PointsRewardRow
            key={reward.id}
            reward={reward}
            availablePoints={pointsBalance}
            onRedeem={onRedeemPoints}
            last={index === pointsRewardOptions.length - 1}
          />
        ))}
      </AppCard>

      <SectionHeader title="Points Activity" />
      {pointActivities.length ? (
        <AppCard style={styles.pointsActivityCard}>
          {pointActivities.map((activity, index) => {
            const positive = activity.points > 0;
            return (
              <RecordListItem
                key={activity.id}
                leading={{
                  type: "icon",
                  icon: positive ? activity.type === "Gift" ? "gift-outline" : "cafe-outline" : "ticket-outline",
                  backgroundColor: colors.tint,
                  color: colors.coffee
                }}
                title={activity.title}
                datetime={activity.date}
                recordId={activity.transactionId}
                source={activity.method}
                secondary={activity.description}
                trailing={{ type: "amount", value: `${positive ? "+" : "-"}${Math.abs(activity.points)} Points`, tone: "points" }}
                last={index === pointActivities.length - 1}
              />
            );
          })}
        </AppCard>
      ) : (
        <AppCard style={styles.pointsEmptyCard}>
          <Ionicons name="receipt-outline" size={24} color={colors.muted} />
          <Text style={styles.pointsEmptyTitle}>No recent points activity</Text>
          <Text style={styles.pointsEmptyText}>Points earned from completed app payments will appear here.</Text>
        </AppCard>
      )}
    </Screen>
  );
}

function PointsRewardRow({
  reward,
  availablePoints,
  onRedeem,
  last = false
}: {
  reward: PointsRewardOption;
  availablePoints: number;
  onRedeem: (reward: PointsRewardOption) => void;
  last?: boolean;
}) {
  const canRedeem = availablePoints >= reward.pointsCost;
  const pointsAway = Math.max(0, reward.pointsCost - availablePoints);
  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={[styles.pointsRewardRow, last && styles.pointsRewardRowLast]}
      onPress={() => onRedeem(reward)}
      accessibilityRole="button"
    >
      <View style={styles.pointsRewardIcon}>
        <Ionicons name={reward.icon} size={18} color={colors.coffee} />
      </View>
      <View style={styles.pointsRewardCopy}>
        <Text style={styles.pointsRewardTitle}>{reward.title}</Text>
        <Text style={styles.pointsRewardText}>{reward.description}</Text>
        <Text style={styles.pointsRewardMeta}>Valid {reward.validDays} days</Text>
      </View>
      <View style={styles.pointsRewardRight}>
        <Text style={styles.pointsRewardCost}>{reward.pointsCost.toLocaleString()}</Text>
        <Text style={styles.pointsRewardCostLabel}>Points</Text>
        <Text style={[styles.pointsRewardAction, !canRedeem && styles.pointsRewardActionMuted]}>
          {canRedeem ? "Redeem" : `${pointsAway.toLocaleString()} Away`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <InfoListItem
      contained
      icon={icon}
      title={label}
      text={value}
      trailing={onPress ? { type: "chevron" } : undefined}
      onPress={onPress}
    />
  );
}

function NotificationPreferenceItem({
  icon,
  label,
  enabled,
  onChange
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <InfoListItem
      contained
      icon={icon}
      title={label}
      text={enabled ? "On" : "Off"}
      trailing={{
        type: "custom",
        node: (
          <Switch
            value={enabled}
            onValueChange={onChange}
            trackColor={{ false: colors.line, true: colors.tint }}
            thumbColor={enabled ? colors.success : colors.muted}
          />
        )
      }}
    />
  );
}

function NotificationPreferencesScreen({
  preferences,
  onChangePreferences,
  onBack
}: {
  preferences: {
    inboxMessages: boolean;
    tipping: boolean;
    receiptsOrders: boolean;
    offersRewards: boolean;
  };
  onChangePreferences: (preferences: {
    inboxMessages: boolean;
    tipping: boolean;
    receiptsOrders: boolean;
    offersRewards: boolean;
  }) => void;
  onBack: () => void;
}) {
  return (
    <Screen
      title="Notification Preferences"
      eyebrow="Messages and receipts"
      scrollKey="notification-preferences"
      onBack={onBack}
      backLabel="Back to Account"
    >
      <NotificationPreferenceItem
        icon="mail-unread-outline"
        label="Inbox Messages"
        enabled={preferences.inboxMessages}
        onChange={(enabled) => onChangePreferences({ ...preferences, inboxMessages: enabled })}
      />
      <NotificationPreferenceItem
        icon="cash-outline"
        label="Tipping"
        enabled={preferences.tipping}
        onChange={(enabled) => onChangePreferences({ ...preferences, tipping: enabled })}
      />
      <NotificationPreferenceItem
        icon="receipt-outline"
        label="Receipts & Orders"
        enabled={preferences.receiptsOrders}
        onChange={(enabled) => onChangePreferences({ ...preferences, receiptsOrders: enabled })}
      />
      <NotificationPreferenceItem
        icon="megaphone-outline"
        label="Offers & Rewards"
        enabled={preferences.offersRewards}
        onChange={(enabled) => onChangePreferences({ ...preferences, offersRewards: enabled })}
      />
    </Screen>
  );
}

function WalletPaymentsScreen({
  walletBalance,
  autoReloadSettings,
  defaultPaymentMethod,
  savedCards,
  currentCardId,
  onOpenTopUp,
  onOpenAutoReload,
  onOpenPaymentMethods,
  onBack
}: {
  walletBalance: number;
  autoReloadSettings: AutoReloadSettings;
  defaultPaymentMethod: PaymentMethodId;
  savedCards: SavedPaymentCard[];
  currentCardId: string;
  onOpenTopUp: () => void;
  onOpenAutoReload: () => void;
  onOpenPaymentMethods: () => void;
  onBack: () => void;
}) {
  const defaultPaymentSummary = formatDefaultPaymentSummary({
    defaultPaymentMethod,
    walletBalance,
    savedCards,
    currentCardId
  });

  return (
    <Screen
      title="Wallet eCard & Payments"
      eyebrow="Balance and methods"
      scrollKey="wallet-payments"
      onBack={onBack}
      backLabel="Back to Account"
    >
      <SectionHeader title="Wallet eCard" />
      <MenuItem icon="wallet-outline" label="Add Funds" value="Bonus available" onPress={onOpenTopUp} />
      <MenuItem
        icon="refresh-outline"
        label="Auto Reload"
        value={formatAutoReloadStatus(autoReloadSettings)}
        onPress={onOpenAutoReload}
      />
      <SectionHeader title="Payment Methods" />
      <MenuItem
        icon="card-outline"
        label="Payment Methods"
        value={defaultPaymentSummary}
        onPress={onOpenPaymentMethods}
      />
    </Screen>
  );
}

function formatDefaultPaymentSummary({
  defaultPaymentMethod,
  walletBalance,
  savedCards,
  currentCardId
}: {
  defaultPaymentMethod: PaymentMethodId;
  walletBalance: number;
  savedCards: SavedPaymentCard[];
  currentCardId: string;
}) {
  if (defaultPaymentMethod === "wallet") {
    return `Wallet eCard · ${formatPaymentAmount(walletBalance)}`;
  }
  if (defaultPaymentMethod === "card") {
    const card = savedCards.find((item) => item.id === currentCardId) ?? savedCards[0];
    return card ? `${card.brand} · •••• ${card.last4}` : "Credit / debit card";
  }
  const method = paymentMethods.find((item) => item.id === defaultPaymentMethod);
  return method ? method.title : "Payment method";
}

function formatAccountId() {
  const registeredDate = memberAssets.registeredDate.replaceAll("-", "");
  const sequence = String(memberAssets.dailyRegistrationSequence).padStart(5, "0");
  return `GA-${registeredDate}-${sequence}`;
}

export function PartnerBenefitsScreen({
  claimedCouponCount,
  onBack,
  onOpenPartnerOffers,
  backLabel = "Back to Account"
}: {
  claimedCouponCount: number;
  onBack: () => void;
  onOpenPartnerOffers: () => void;
  backLabel?: string;
}) {
  const activeOffers = partnerOffers.filter((offer) => offer.status === "Active");
  const diningCount = activeOffers.filter((offer) => offer.partnerName.includes("Happy Lamb")).length;
  const entertainmentCount = activeOffers.filter((offer) => offer.partnerName.includes("Cineplex")).length;
  const eventCount = activeOffers.filter((offer) => offer.partnerName.includes("FIFA")).length;
  const featuredOffers = activeOffers.slice(0, 2);

  return (
    <Screen
      title="Partner Benefits"
      eyebrow="Membership perks"
      scrollKey="partner-benefits"
      onBack={onBack}
      backLabel={backLabel}
    >
      <AppCard style={styles.partnerBenefitsHero}>
        <View>
          <Text style={styles.partnerBenefitsEyebrow}>LOCAL PARTNER PERKS</Text>
          <Text style={styles.partnerBenefitsTitle}>Dining, movies, events and local lifestyle benefits.</Text>
        </View>
        <View style={styles.partnerBenefitsStats}>
          <Text style={styles.partnerBenefitsStatValue}>{activeOffers.length}</Text>
          <Text style={styles.partnerBenefitsStatLabel}>active offers</Text>
          <Text style={styles.partnerBenefitsStatMeta}>{claimedCouponCount} claimed assets</Text>
        </View>
      </AppCard>

      <SectionHeader title="Benefit Categories" />
      <View style={styles.partnerCategoryGrid}>
        <PartnerCategoryCard icon="restaurant-outline" title="Dining" value={`${diningCount} offers`} />
        <PartnerCategoryCard icon="film-outline" title="Entertainment" value={`${entertainmentCount} offer`} />
        <PartnerCategoryCard icon="ticket-outline" title="Events" value={`${eventCount} offer`} />
      </View>

      <SectionHeader title="How Partner Benefits Work" />
      <InfoListItem
        contained
        icon="ticket-outline"
        title="Claim Coupons"
        text="Free to claim, then saved to your Coupons."
      />
      <InfoListItem
        contained
        icon="card-outline"
        title="Buy Partner Offers"
        text="Pay in app, then redeem with the partner."
      />
      <InfoListItem
        contained
        icon="storefront-outline"
        title="Use at Partner"
        text="Show the voucher, ticket, or coupon when visiting."
      />
      <InfoListItem
        contained
        icon="time-outline"
        title="Limited Availability"
        text="Some offers can sell out, expire, or be location limited."
      />

      <SectionHeader
        title="Featured Partner Offers"
        action="View All"
        onActionPress={onOpenPartnerOffers}
      />
      <View style={styles.partnerFeaturedList}>
        {featuredOffers.map((offer) => (
          <InfoListItem
            key={offer.id}
            contained
            icon={offer.offerType === "purchase_offer" ? "card-outline" : "ticket-outline"}
            title={offer.partnerName}
            text={`${offer.title} · ${offer.distance} away`}
            value={offer.actionLabel}
            valueTone="accent"
            onPress={onOpenPartnerOffers}
          />
        ))}
      </View>
    </Screen>
  );
}

function PartnerCategoryCard({
  icon,
  title,
  value
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
}) {
  return (
    <AppCard style={styles.partnerCategoryCard}>
      <View style={styles.partnerCategoryIcon}>
        <Ionicons name={icon} size={18} color={colors.coffee} />
      </View>
      <Text style={styles.partnerCategoryTitle}>{title}</Text>
      <Text style={styles.partnerCategoryValue}>{value}</Text>
    </AppCard>
  );
}

const swipeDeleteWidth = 82;
const swipeOpenThreshold = 22;

function formatPaymentAmount(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatWholePaymentAmount(value: number) {
  return `$${Math.round(value)}`;
}

function formatAutoReloadStatus(settings: AutoReloadSettings) {
  return settings.enabled
    ? `On · Below ${formatWholePaymentAmount(settings.threshold)}, add ${formatWholePaymentAmount(settings.amount)}`
    : "Off";
}

function getProductDisplayAreaLabel(area: ProductDisplayArea) {
  switch (area) {
    case "homeBestSellers":
      return "Home Best Sellers";
    case "orderAllMenu":
      return "Order All Menu";
    case "homePartnerOffers":
      return "Home Partner Offers";
    case "allPartnerOffers":
      return "All Partner Offers";
  }
}

function formatProductDisplayOverride(value: ProductDisplayOverride) {
  if (value === "default") {
    return "Use default";
  }
  return value === "row" ? "Rows" : "Cards";
}

function getNextProductDisplayOverride(value: ProductDisplayOverride): ProductDisplayOverride {
  if (value === "default") {
    return "row";
  }
  if (value === "row") {
    return "card";
  }
  return "default";
}

const autoReloadHistoryRecords = [
  {
    id: "AF-260622-000184",
    date: "2026-06-22 09:18",
    threshold: 10,
    amount: 30,
    paymentMethod: "Visa · •••• 4242"
  },
  {
    id: "AF-260621-000097",
    date: "2026-06-21 18:42",
    threshold: 10,
    amount: 30,
    paymentMethod: "Visa · •••• 4242"
  },
  {
    id: "AF-260620-000031",
    date: "2026-06-20 08:07",
    threshold: 5,
    amount: 10,
    paymentMethod: "Wallet rule"
  },
  {
    id: "AF-260619-000264",
    date: "2026-06-19 21:36",
    threshold: 15,
    amount: 50,
    paymentMethod: "Visa · •••• 4242"
  },
  {
    id: "AF-260618-000142",
    date: "2026-06-18 12:24",
    threshold: 10,
    amount: 30,
    paymentMethod: "Apple Pay"
  },
  {
    id: "AF-260616-000088",
    date: "2026-06-16 16:05",
    threshold: 10,
    amount: 30,
    paymentMethod: "Visa · •••• 4242"
  },
  {
    id: "AF-260614-000052",
    date: "2026-06-14 09:41",
    threshold: 5,
    amount: 10,
    paymentMethod: "Visa · •••• 4242"
  },
  {
    id: "AF-260611-000219",
    date: "2026-06-11 19:12",
    threshold: 15,
    amount: 100,
    paymentMethod: "PayPal"
  }
];

function SavedPaymentMethodsScreen({
  walletBalance,
  walletBalances,
  defaultPaymentMethod,
  onSetDefaultPaymentMethod,
  addedPaymentMethodIds,
  onSetAddedPaymentMethodIds,
  savedCards,
  onSetSavedCards,
  currentCardId,
  onSetCurrentCardId,
  systemPaymentMethodIds,
  onShowToast,
  onBack,
  backLabel = "Back to Account"
}: {
  walletBalance: number;
  walletBalances: WalletBalances;
  defaultPaymentMethod: PaymentMethodId;
  onSetDefaultPaymentMethod: (methodId: PaymentMethodId) => void;
  addedPaymentMethodIds: PaymentMethodId[];
  onSetAddedPaymentMethodIds: (ids: PaymentMethodId[] | ((ids: PaymentMethodId[]) => PaymentMethodId[])) => void;
  savedCards: SavedPaymentCard[];
  onSetSavedCards: (cards: SavedPaymentCard[] | ((cards: SavedPaymentCard[]) => SavedPaymentCard[])) => void;
  currentCardId: string;
  onSetCurrentCardId: (cardId: string) => void;
  systemPaymentMethodIds: PaymentMethodId[];
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
  onBack: () => void;
  backLabel?: string;
}) {
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [openSwipeItemId, setOpenSwipeItemId] = useState<string | null>(null);
  const availablePaymentMethods = getAvailablePaymentMethods({
    addedPaymentMethodIds,
    currentCardId,
    savedCards,
    systemPaymentMethodIds
  });
  const digitalPaymentMethods = availablePaymentMethods.filter((method) =>
    method.id !== "wallet" && method.id !== "card"
  );
  const walletMethod = paymentMethods.find((method) => method.id === "wallet") ?? paymentMethods[0];

  function removeCard(cardId: string) {
    const removedCard = savedCards.find((card) => card.id === cardId);
    const isRemovedDefaultCard = defaultPaymentMethod === "card" && cardId === currentCardId;
    const remainingCards = savedCards.filter((card) => card.id !== cardId);
    onSetSavedCards(remainingCards);
    if (cardId === currentCardId) {
      onSetCurrentCardId(remainingCards[0]?.id ?? "");
    }
    if (remainingCards.length === 0) {
      onSetAddedPaymentMethodIds((ids) => ids.filter((id) => id !== "card"));
    }
    if (isRemovedDefaultCard) {
      onSetDefaultPaymentMethod("wallet");
    }
    onShowToast({
      tone: "info",
      title: "Card removed",
      message: removedCard ? `${removedCard.brand} ending in ${removedCard.last4}` : "Payment card removed.",
      icon: "trash-outline"
    });
  }

  function confirmRemoveCard(card: SavedPaymentCard) {
    Alert.alert(
      "Remove card?",
      `${card.brand} ending in ${card.last4} will be removed from app payments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeCard(card.id)
        }
      ]
    );
  }

  function setDefaultCard(card: SavedPaymentCard) {
    const wasCurrentDefault = defaultPaymentMethod === "card" && card.id === currentCardId;
    onSetCurrentCardId(card.id);
    if (wasCurrentDefault) {
      return;
    }
    onSetDefaultPaymentMethod("card");
  }

  function setDefaultPayment(methodId: PaymentMethodId) {
    if (methodId === defaultPaymentMethod) {
      return;
    }
    onSetDefaultPaymentMethod(methodId);
  }

  function removePaymentMethod(methodId: PaymentMethodId) {
    if (methodId === "wallet") {
      return;
    }
    const method = paymentMethods.find((item) => item.id === methodId);
    onSetAddedPaymentMethodIds((ids) => ids.filter((id) => id !== methodId));
    if (defaultPaymentMethod === methodId) {
      onSetDefaultPaymentMethod("wallet");
    }
    onShowToast({
      tone: "info",
      title: "Payment method removed",
      message: method ? `${method.title} was removed from app payments.` : "Payment method removed.",
      icon: "trash-outline"
    });
  }

  function addPaymentMethodFromSharedFlow(methodId: PaymentMethodId, card?: SavedPaymentCard, makeDefault = false) {
    if (methodId === "card" && card) {
      onSetSavedCards((cards) => [...cards, card]);
      onSetAddedPaymentMethodIds((ids) => ids.includes("card") ? ids : [...ids, "card"]);
      if (makeDefault) {
        onSetCurrentCardId(card.id);
      }
      if (makeDefault) {
        onSetDefaultPaymentMethod("card");
      }
      onShowToast({
        tone: "success",
        title: "Card added",
        message: `${card.brand} ending in ${card.last4} is ready to use.`,
        icon: "card-outline"
      });
    }
  }

  if (isAddingPaymentMethod) {
    return (
      <PaymentMethodSelectionScreen
        mode="checkout"
        selectedPayment={defaultPaymentMethod}
        walletBalance={walletBalance}
        availableMethods={availablePaymentMethods}
        initialPage="add-method"
        backLabel="Back to Payment Methods"
        onBack={() => setIsAddingPaymentMethod(false)}
        onAddPaymentMethod={addPaymentMethodFromSharedFlow}
        onSelect={() => setIsAddingPaymentMethod(false)}
      />
    );
  }

  return (
    <Screen title="Payment Methods" eyebrow="Wallet & payments" scrollKey="saved-payment-methods" onBack={onBack} backLabel={backLabel}>
      <Text style={styles.pageIntro}>Choose how you pay for orders and add funds to your Wallet eCard.</Text>
      <View style={styles.walletBenefitCard}>
        <View style={styles.walletBenefitIcon}>
          <Ionicons name="wallet-outline" size={17} color={colors.success} />
        </View>
        <View style={styles.walletBenefitCopy}>
          <View style={styles.walletBenefitTitleRow}>
            <Text style={styles.walletBenefitTitle}>Save More with Wallet eCard</Text>
            <Text style={styles.walletBenefitPillText}>Up to 15% Bonus</Text>
          </View>
          <Text style={styles.walletBenefitText}>
            Add funds to receive Bonus, then make Wallet eCard your default payment for orders, gifts and prepaid drinks.
          </Text>
        </View>
      </View>
      <View style={styles.paymentMethodList}>
        <OptionListItem
          variant="select"
          selected={defaultPaymentMethod === "wallet"}
          leading={{
            type: "icon",
            icon: walletMethod.icon,
            tone: "success",
            color: "#FFFFFF",
            backgroundColor: colors.success
          }}
          title={walletMethod.title}
          text={`Available Balance ${formatPaymentAmount(walletBalance)}`}
          onPress={() => {
            setOpenSwipeItemId(null);
            setDefaultPayment("wallet");
          }}
        />
        {savedCards.map((card) => {
          const isDefaultCard = defaultPaymentMethod === "card" && card.id === currentCardId;
          const swipeItemId = `card-${card.id}`;
          return (
            <SwipeDeleteOptionItem
              key={card.id}
              itemId={swipeItemId}
              openItemId={openSwipeItemId}
              onOpenItemChange={setOpenSwipeItemId}
              onDelete={() => confirmRemoveCard(card)}
              accessibilityLabel={`Delete ${card.brand} ending in ${card.last4}`}
            >
              <OptionListItem
                variant="select"
                selected={isDefaultCard}
                leading={{ type: "icon", icon: "card-outline" }}
                title={`${card.brand} · •••• ${card.last4}`}
                text={`Expires ${card.expiry}`}
                onPress={() => {
                  setOpenSwipeItemId(null);
                  setDefaultCard(card);
                }}
              />
            </SwipeDeleteOptionItem>
          );
        })}
        {digitalPaymentMethods.map((method) => {
          const isDefault = method.id === defaultPaymentMethod;
          const isSystemMethod = systemPaymentMethodIds.includes(method.id);
          const swipeItemId = `method-${method.id}`;
          return (
            <SwipeDeleteOptionItem
              key={method.id}
              itemId={swipeItemId}
              openItemId={openSwipeItemId}
              onOpenItemChange={setOpenSwipeItemId}
              disabled={isSystemMethod}
              onDelete={() => removePaymentMethod(method.id)}
              accessibilityLabel={`Remove ${method.title}`}
            >
              <OptionListItem
                variant="select"
                selected={isDefault}
                leading={{
                  type: "icon",
                  icon: method.icon,
                  tone: "success",
                  color: colors.onDark,
                  backgroundColor: colors.success
                }}
                title={method.title}
                text={method.subtitle}
                onPress={() => {
                  setOpenSwipeItemId(null);
                  setDefaultPayment(method.id);
                }}
              />
            </SwipeDeleteOptionItem>
          );
        })}
        <OptionListItem
          variant="navigate"
          leading={{
            type: "icon",
            icon: "add-circle-outline",
            tone: "neutral",
            color: colors.ink
          }}
          title="Add Payment Method"
          text="Credit / debit card or PayPal"
          onPress={() => {
            setOpenSwipeItemId(null);
            setIsAddingPaymentMethod(true);
          }}
        />
      </View>
    </Screen>
  );
}

function SwipeDeleteOptionItem({
  itemId,
  openItemId,
  onOpenItemChange,
  children,
  onDelete,
  accessibilityLabel,
  disabled = false
}: {
  itemId: string;
  openItemId: string | null;
  onOpenItemChange: (itemId: string | null) => void;
  children: ReactNode;
  onDelete: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const isOpen = openItemId === itemId;

  const animateTo = (value: number) => {
    openRef.current = value < 0;
    Animated.timing(translateX, {
      toValue: value,
      useNativeDriver: true,
      duration: 180
    }).start();
  };

  useEffect(() => {
    if (!isOpen && openRef.current) {
      animateTo(0);
    }
  }, [isOpen]);

  const panResponder = PanResponder.create({
    onPanResponderGrant: () => {
      translateX.stopAnimation();
      if (openItemId && openItemId !== itemId) {
        onOpenItemChange(null);
      }
    },
    onMoveShouldSetPanResponder: (_, gesture) =>
      !disabled && Math.abs(gesture.dx) > 4 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.05,
    onPanResponderMove: (_, gesture) => {
      const base = openRef.current ? -swipeDeleteWidth : 0;
      const nextValue = Math.max(-swipeDeleteWidth, Math.min(0, base + gesture.dx * 1.12));
      translateX.setValue(nextValue);
    },
    onPanResponderRelease: (_, gesture) => {
      const base = openRef.current ? -swipeDeleteWidth : 0;
      const nextValue = Math.max(-swipeDeleteWidth, Math.min(0, base + gesture.dx * 1.12));
      const shouldOpen = openRef.current
        ? nextValue < -swipeDeleteWidth + swipeOpenThreshold
        : nextValue < -swipeOpenThreshold;
      onOpenItemChange(shouldOpen ? itemId : null);
      animateTo(shouldOpen ? -swipeDeleteWidth : 0);
    },
    onPanResponderTerminate: () => {
      animateTo(isOpen ? -swipeDeleteWidth : 0);
    },
    onPanResponderTerminationRequest: () => false
  });

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.swipeDeleteRoot}>
      <View style={styles.swipeDeleteAction}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          activeOpacity={0.84}
          style={styles.swipeDeleteButton}
          onPress={() => {
            onOpenItemChange(null);
            animateTo(0);
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.swipeDeleteContent, { transform: [{ translateX }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function AccountScreen({
  profile,
  onSaveProfile,
  onBack
}: {
  profile: Profile;
  onSaveProfile: (profile: Profile) => void;
  onBack: () => void;
}) {
  const [editingField, setEditingField] = useState<keyof Profile | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [securityPage, setSecurityPage] = useState<"sign-in" | "payment" | null>(null);

  function startEditing(field: keyof Profile) {
    setDraftValue(profile[field]);
    setEditingField(field);
  }

  function saveField() {
    const nextValue = draftValue.trim();
    if (!editingField || !nextValue) {
      return;
    }
    onSaveProfile({ ...profile, [editingField]: nextValue });
    setEditingField(null);
  }

  if (securityPage === "sign-in") {
    return <SignInSecurityScreen onBack={() => setSecurityPage(null)} />;
  }

  if (securityPage === "payment") {
    return <PaymentSecurityScreen onBack={() => setSecurityPage(null)} />;
  }

  if (editingField) {
    const fieldConfig = getProfileFieldConfig(editingField);

    return (
      <Screen
        title={`Edit ${fieldConfig.label}`}
        eyebrow="Personal information"
        scrollKey={`edit-profile-${editingField}`}
        onBack={() => setEditingField(null)}
        backLabel="Cancel"
      >
        <Text style={styles.fieldLabel}>{fieldConfig.label}</Text>
        <TextInput
          style={styles.profileInput}
          value={draftValue}
          onChangeText={setDraftValue}
          placeholder={fieldConfig.placeholder}
          placeholderTextColor={colors.muted}
          autoCapitalize={fieldConfig.autoCapitalize}
          autoCorrect={false}
          keyboardType={fieldConfig.keyboardType}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={saveField}
        />
        <Text style={styles.fieldHint}>{fieldConfig.hint}</Text>
        <TouchableOpacity
          style={[styles.saveButton, !draftValue.trim() && styles.saveButtonDisabled]}
          disabled={!draftValue.trim()}
          onPress={saveField}
          activeOpacity={0.86}
        >
          <Text style={styles.saveButtonText}>Save changes</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen title="Profile" eyebrow="Personal Info" scrollKey="profile-info" onBack={onBack} backLabel="Back to Account">
      <SectionHeader title="Personal Information" />
      <MenuItem icon="person-outline" label="Name" value={profile.name} onPress={() => startEditing("name")} />
      <MenuItem icon="mail-outline" label="Email" value={profile.email} onPress={() => startEditing("email")} />
      <MenuItem icon="call-outline" label="Phone" value={maskPhone(profile.phone)} onPress={() => startEditing("phone")} />

      <SectionHeader title="Security" />
      <MenuItem
        icon="lock-closed-outline"
        label="Password & Sign-in"
        value="Manage"
        onPress={() => setSecurityPage("sign-in")}
      />
      <MenuItem
        icon="shield-checkmark-outline"
        label="Payment Security"
        value="Protected"
        onPress={() => setSecurityPage("payment")}
      />
    </Screen>
  );
}

function SignInSecurityScreen({ onBack }: { onBack: () => void }) {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [deviceSignedOut, setDeviceSignedOut] = useState(false);

  return (
    <Screen title="Password & Sign-in" eyebrow="Account security" scrollKey="sign-in-security" onBack={onBack} backLabel="Back to Account">

      <SectionHeader title="Sign-in Methods" />
      <SecurityAction
        icon="key-outline"
        label="Password"
        detail={passwordChanged ? "Updated just now" : "Last changed 90 days ago"}
        action={passwordChanged ? "Updated" : "Change"}
        onPress={() => setPasswordChanged(true)}
      />
      <SettingToggle
        icon="finger-print-outline"
        label="Face ID / Biometrics"
        value={biometricEnabled}
        onValueChange={setBiometricEnabled}
      />

      <SectionHeader title="Signed-in Devices" />
      <AppCard style={styles.securityDeviceCard}>
        <View style={styles.securityDeviceIcon}>
          <Ionicons name="phone-portrait-outline" size={21} color={colors.ink} />
        </View>
        <View style={styles.securityDeviceCopy}>
          <View style={styles.securityDeviceTitleRow}>
            <Text style={styles.securityDeviceTitle}>This iPhone</Text>
            <View style={styles.currentDevicePill}>
              <Text style={styles.currentDeviceText}>Current</Text>
            </View>
          </View>
          <Text style={styles.securityDeviceDetail}>Coquitlam, BC · Active now</Text>
        </View>
      </AppCard>
      {!deviceSignedOut ? (
        <AppCard style={styles.securityDeviceCard}>
          <View style={styles.securityDeviceIcon}>
            <Ionicons name="desktop-outline" size={21} color={colors.ink} />
          </View>
          <View style={styles.securityDeviceCopy}>
            <Text style={styles.securityDeviceTitle}>Safari on Mac</Text>
            <Text style={styles.securityDeviceDetail}>Vancouver, BC · 2 days ago</Text>
          </View>
          <TouchableOpacity onPress={() => setDeviceSignedOut(true)} activeOpacity={0.84}>
            <Text style={styles.dangerActionText}>Sign out</Text>
          </TouchableOpacity>
        </AppCard>
      ) : (
        <Text style={styles.successMessage}>Safari on Mac has been signed out.</Text>
      )}
    </Screen>
  );
}

function PaymentSecurityScreen({ onBack }: { onBack: () => void }) {
  const [biometricPayment, setBiometricPayment] = useState(true);
  const [confirmEveryPayment, setConfirmEveryPayment] = useState(true);
  const [pinChanged, setPinChanged] = useState(false);

  return (
    <Screen title="Payment Security" eyebrow="Protected payments" scrollKey="payment-security" onBack={onBack} backLabel="Back to Account">

      <AppCard style={styles.securityStatusCard}>
        <View style={styles.securityStatusIcon}>
          <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.securityStatusCopy}>
          <Text style={styles.securityStatusTitle}>Your payments are protected</Text>
          <Text style={styles.securityStatusText}>
            Identity verification is required before wallet and saved-card payments.
          </Text>
        </View>
      </AppCard>

      <SectionHeader title="Payment Verification" />
      <SettingToggle
        icon="finger-print-outline"
        label="Face ID / Biometrics"
        value={biometricPayment}
        onValueChange={setBiometricPayment}
      />
      <SettingToggle
        icon="checkmark-circle-outline"
        label="Confirm Every Payment"
        value={confirmEveryPayment}
        onValueChange={setConfirmEveryPayment}
      />
      <SecurityAction
        icon="keypad-outline"
        label="Wallet PIN"
        detail={pinChanged ? "PIN updated just now" : "Required as a backup"}
        action={pinChanged ? "Updated" : "Change"}
        onPress={() => setPinChanged(true)}
      />

      <SectionHeader title="Protection" />
      <SecurityInfoRow
        icon="notifications-outline"
        label="Transaction Alerts"
        detail="Enabled for every payment"
      />
      <SecurityInfoRow
        icon="lock-closed-outline"
        label="Saved Card Data"
        detail="Encrypted and tokenized"
      />
    </Screen>
  );
}

function SecurityAction({
  icon,
  label,
  detail,
  action,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <InfoListItem
      icon={icon}
      title={label}
      text={detail}
      style={styles.securityListItem}
      trailing={{
        type: "custom",
        node: (
          <TouchableOpacity style={styles.securityActionButton} onPress={onPress} activeOpacity={0.84}>
            <Text style={styles.securityActionButtonText}>{action}</Text>
          </TouchableOpacity>
        )
      }}
    />
  );
}

function SecurityInfoRow({
  icon,
  label,
  detail,
  detailEmphasis,
  detailSuffix,
  emphasisTone = "success",
  eligible = true
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  detailEmphasis?: string;
  detailSuffix?: string;
  emphasisTone?: "success" | "danger";
  eligible?: boolean;
}) {
  return (
    <InfoListItem
      icon={icon}
      title={label}
      detail={
        <Text style={styles.securityRowDetail}>
          {detail}
          {detailEmphasis ? (
            <Text
              style={
                emphasisTone === "danger"
                  ? styles.securityRowDetailDanger
                  : styles.securityRowDetailSuccess
              }
            >
              {" "}{detailEmphasis}
            </Text>
          ) : null}
          {detailSuffix ? ` ${detailSuffix}` : null}
        </Text>
      }
      style={styles.securityListItem}
      trailing={{
        type: "custom",
        node: (
          <Ionicons
            name={eligible ? "checkmark-circle" : "close-circle"}
            size={20}
            color={eligible ? colors.success : colors.berry}
          />
        )
      }}
    />
  );
}

function getProfileFieldConfig(field: keyof Profile): {
  label: string;
  placeholder: string;
  hint: string;
  keyboardType: KeyboardTypeOptions;
  autoCapitalize: "none" | "words";
} {
  if (field === "email") {
    return {
      label: "Email",
      placeholder: "name@example.com",
      hint: "We use this email for receipts and account recovery.",
      keyboardType: "email-address",
      autoCapitalize: "none"
    };
  }
  if (field === "phone") {
    return {
      label: "Phone",
      placeholder: "+1 604 555 0188",
      hint: "Used for pickup and account security notifications.",
      keyboardType: "phone-pad",
      autoCapitalize: "none"
    };
  }
  return {
    label: "Name",
    placeholder: "Your name",
    hint: "This name appears on your member profile.",
    keyboardType: "default",
    autoCapitalize: "words"
  };
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const lastFour = digits.slice(-4);
  return lastFour ? `+1 ••• ••• ${lastFour}` : phone;
}

function AboutScreen({ onBack, onResetDemoState }: { onBack: () => void; onResetDemoState: () => void }) {
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "current">("idle");
  const [automaticUpdatesEnabled, setAutomaticUpdatesEnabled] = useState(true);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  function checkForUpdates() {
    setUpdateStatus("checking");
    setTimeout(() => setUpdateStatus("current"), 700);
  }

  if (showWhatsNew) {
    return (
      <Screen title="What's New" eyebrow={APP_VERSION_TEXT} scrollKey="whats-new" onBack={() => setShowWhatsNew(false)} backLabel="Back to About">
        <AppCard style={styles.releaseCard}>
          <View style={styles.releaseHeader}>
            <View>
              <Text style={styles.releaseVersion}>{APP_VERSION_TEXT}</Text>
              <Text style={styles.releaseDate}>{APP_BUILD_TEXT}</Text>
            </View>
            <View style={styles.currentDevicePill}>
              <Text style={styles.currentDeviceText}>Latest</Text>
            </View>
          </View>
          <ReleaseItem icon="home-outline" text="A richer Home experience with pickup reminders and personalized shortcuts." />
          <ReleaseItem icon="wallet-outline" text="Wallet eCard balance with unified payment activity." />
          <ReleaseItem icon="diamond-outline" text="Member Growth tiers, EXP progress and member rewards." />
          <ReleaseItem icon="shield-checkmark-outline" text="Account, sign-in and payment security controls." />
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen title="About" eyebrow={productCopy.brandName} scrollKey="about" onBack={onBack} backLabel="Back to Account">
      <AppCard style={styles.aboutCard}>
        <Image
          source={require("../../assets/about-brand-icon.png")}
          style={styles.aboutBrandIcon}
          resizeMode="cover"
          accessibilityLabel={`${productCopy.brandName} brand icon`}
        />
        <Text style={styles.aboutName}>{productCopy.brandName}</Text>
        <Text style={styles.aboutVersion}>{APP_VERSION_LABEL} · Up to date</Text>
      </AppCard>

      <SectionHeader title="App Updates" />
      <MenuItem
        icon="refresh-outline"
        label="Check for Updates"
        value={
          updateStatus === "checking"
            ? "Checking..."
            : updateStatus === "current"
              ? "Up to date"
              : APP_VERSION_TEXT
        }
        onPress={updateStatus === "checking" ? undefined : checkForUpdates}
      />
      <SettingToggle
        icon="download-outline"
        label="Automatic Updates"
        detail="Managed by App Store or Google Play"
        value={automaticUpdatesEnabled}
        onValueChange={setAutomaticUpdatesEnabled}
      />
      <MenuItem
        icon="sparkles-outline"
        label="What's New"
        value={APP_VERSION_TEXT}
        onPress={() => setShowWhatsNew(true)}
      />

      <SectionHeader title="Information" />
      <MenuItem icon="document-text-outline" label="Application Terms" value="" />
      <MenuItem icon="shield-outline" label="Privacy Policy" value="" />
      <MenuItem icon="information-circle-outline" label="Open-source Licenses" value="" />

    </Screen>
  );
}

function ReleaseItem({
  icon,
  text
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.releaseItem}>
      <View style={styles.releaseItemIcon}>
        <Ionicons name={icon} size={17} color={colors.coffee} />
      </View>
      <Text style={styles.releaseItemText}>{text}</Text>
    </View>
  );
}

function SettingToggle({
  icon,
  label,
  detail,
  value,
  onValueChange
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <InfoListItem
      contained
      icon={icon}
      title={label}
      text={detail}
      trailing={{
        type: "custom",
        node: (
          <Switch
            style={styles.settingToggleSwitch}
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.line, true: "#9FC6AE" }}
            thumbColor={value ? colors.success : "#FFFFFF"}
          />
        )
      }}
    />
  );
}

const styles = StyleSheet.create({
  accountShortcut: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  activityShortcuts: {
    flexDirection: "row",
    gap: 8
  },
  activityShortcut: {
    flex: 1,
    minWidth: 0,
    minHeight: 70,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  activityShortcutIcon: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  activityShortcutLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600"
  },
  partnerBenefitsHero: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    backgroundColor: colors.ink
  },
  partnerBenefitsEyebrow: {
    color: colors.milk,
    fontSize: 9,
    fontWeight: "900"
  },
  partnerBenefitsTitle: {
    maxWidth: 210,
    color: colors.onDark,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: 7
  },
  partnerBenefitsStats: {
    minWidth: 88,
    alignItems: "flex-end"
  },
  partnerBenefitsStatValue: {
    color: colors.onDark,
    fontSize: 26,
    fontWeight: "900"
  },
  partnerBenefitsStatLabel: {
    color: colors.onDark,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    opacity: 0.82
  },
  partnerBenefitsStatMeta: {
    color: colors.milk,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "right"
  },
  partnerCategoryGrid: {
    flexDirection: "row",
    gap: 8
  },
  partnerCategoryCard: {
    flex: 1,
    minHeight: 92,
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  partnerCategoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  partnerCategoryTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 9
  },
  partnerCategoryValue: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3
  },
  partnerFeaturedList: {
    gap: 8
  },
  productDisplaySection: {
    gap: 8,
    marginTop: 4
  },
  productDisplayIntro: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: -4
  },
  themeSelector: {
    gap: 8
  },
  themeOptionIcon: {
    width: 52,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 8
  },
  themeOptionAccentRow: {
    flexDirection: "row",
    gap: 3
  },
  themeOptionAccent: {
    width: 7,
    height: 3,
    borderRadius: 2
  },
  autoReloadCard: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingVertical: 10
  },
  autoReloadHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  autoReloadIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.success.subtleBackground
  },
  autoReloadCopy: {
    flex: 1,
    minWidth: 0
  },
  autoReloadTitle: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800"
  },
  autoReloadText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3
  },
  autoReloadSwitch: {
    width: 40,
    height: 24,
    padding: 2,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: statusColors.neutral.background
  },
  autoReloadSwitchOn: {
    backgroundColor: colors.success
  },
  autoReloadSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: colors.surface
  },
  autoReloadSwitchKnobOn: {
    alignSelf: "flex-end"
  },
  autoReloadSettings: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  autoReloadSettingGroup: {
    gap: spacing.sm
  },
  autoReloadSettingLabel: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700"
  },
  autoReloadChipRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  autoReloadChip: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  autoReloadChipSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  autoReloadChipText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700"
  },
  autoReloadChipTextSelected: {
    color: colors.onDark
  },
  autoReloadFootnote: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600"
  },
  autoReloadHistoryCard: {
    paddingVertical: 4
  },
  autoReloadEmptyCard: {
    minHeight: 124,
    alignItems: "center",
    justifyContent: "center"
  },
  autoReloadEmptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  autoReloadEmptyText: {
    maxWidth: 240,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4
  },
  pointsHero: {
    alignItems: "center",
    paddingVertical: 22,
    backgroundColor: statusColors.success.background,
    borderColor: statusColors.success.border
  },
  pointsHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success
  },
  pointsHeroValue: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    marginTop: 10
  },
  pointsHeroLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2
  },
  pointsMultiplierPill: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E2F0E7"
  },
  pointsMultiplierText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700"
  },
  pointsHeroHint: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10
  },
  pointsExpiryCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: statusColors.warning.background,
    borderColor: statusColors.warning.border
  },
  pointsExpiryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4D8"
  },
  pointsExpiryCopy: {
    flex: 1
  },
  pointsExpiryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  pointsExpiryText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 3
  },
  pointsShopCard: {
    paddingVertical: 4
  },
  pointsRewardRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  pointsRewardRowLast: {
    borderBottomWidth: 0
  },
  pointsRewardIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  pointsRewardCopy: {
    flex: 1,
    minWidth: 0
  },
  pointsRewardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  pointsRewardText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3
  },
  pointsRewardMeta: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4
  },
  pointsRewardRight: {
    width: 76,
    alignItems: "flex-end"
  },
  pointsRewardCost: {
    color: colors.success,
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"]
  },
  pointsRewardCostLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1
  },
  pointsRewardAction: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6
  },
  pointsRewardActionMuted: {
    color: colors.muted
  },
  pointsActivityCard: {
    paddingVertical: 4
  },
  pointsEmptyCard: {
    alignItems: "center",
    paddingVertical: 22
  },
  pointsEmptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  pointsEmptyText: {
    maxWidth: 250,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4
  },
  walletGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  walletTile: {
    width: "100%",
    minHeight: 86
  },
  walletTilePressable: {
    borderColor: "#D8C7A7"
  },
  walletTileTap: {
    width: "48%"
  },
  walletValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  walletTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6
  },
  walletLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6
  },
  walletDetail: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "700",
    marginTop: 3
  },
  settingToggleSwitch: {
    transform: [{ scale: 0.9 }]
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    marginBottom: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600"
  },
  pageIntro: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 14
  },
  paymentMethodList: {
    gap: 9
  },
  walletBenefitCard: {
    marginBottom: 12,
    paddingVertical: 11,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line
  },
  walletBenefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.success.subtleBackground
  },
  walletBenefitCopy: {
    flex: 1
  },
  walletBenefitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  walletBenefitTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  walletBenefitText: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16
  },
  walletBenefitPillText: {
    flexShrink: 0,
    color: colors.success,
    fontSize: 10,
    fontWeight: "800"
  },
  swipeDeleteRoot: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8
  },
  swipeDeleteAction: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: swipeDeleteWidth,
    alignItems: "stretch"
  },
  swipeDeleteButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.berry
  },
  swipeDeleteContent: {
    backgroundColor: colors.canvas
  },
  cardFormLabel: {
    marginTop: 16
  },
  cardExpiryHint: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6
  },
  cardValidationRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  cardValidationText: {
    flex: 1,
    color: colors.warning,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14
  },
  cardReadyRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  cardReadyText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "700"
  },
  emptyCards: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyCardsTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  emptyCardsText: {
    maxWidth: 230,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4
  },
  outlineButton: {
    minHeight: 46,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderColor: colors.coffee,
    borderWidth: 1
  },
  outlineButtonText: {
    color: colors.coffee,
    fontSize: 13,
    fontWeight: "700"
  },
  outlineButtonDisabled: {
    borderColor: colors.line,
    backgroundColor: colors.surface
  },
  outlineButtonTextDisabled: {
    color: colors.muted
  },
  aboutCard: {
    alignItems: "center",
    paddingVertical: 24
  },
  aboutBrandIcon: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: "#000000"
  },
  aboutName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12
  },
  aboutVersion: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5
  },
  releaseCard: {
    gap: 2
  },
  releaseHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  releaseVersion: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  releaseDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4
  },
  releaseItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  releaseItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  releaseItemText: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7
  },
  profileInput: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 8,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: colors.surface,
    borderColor: colors.coffee,
    borderWidth: 1
  },
  fieldHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 8
  },
  saveButton: {
    minHeight: 50,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.ink
  },
  saveButtonDisabled: {
    opacity: 0.35
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  securityListItem: {
    minHeight: 66
  },
  securityRow: {
    minHeight: 66,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  securityRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  securityRowCopy: {
    flex: 1
  },
  securityRowLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  securityRowDetail: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3
  },
  securityRowDetailDanger: {
    color: colors.berry,
    fontWeight: "700"
  },
  securityRowDetailSuccess: {
    color: colors.success,
    fontWeight: "700"
  },
  securityActionButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  securityActionButtonText: {
    color: colors.coffee,
    fontSize: 11,
    fontWeight: "700"
  },
  securityDeviceCard: {
    minHeight: 68,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  securityDeviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  securityDeviceCopy: {
    flex: 1
  },
  securityDeviceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  securityDeviceTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  securityDeviceDetail: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4
  },
  currentDevicePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#E5F1E9"
  },
  currentDeviceText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: "700"
  },
  dangerActionText: {
    color: colors.berry,
    fontSize: 11,
    fontWeight: "700"
  },
  successMessage: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 10
  },
  securityStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: statusColors.success.background,
    borderColor: statusColors.success.border
  },
  securityStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success
  },
  securityStatusCopy: {
    flex: 1
  },
  securityStatusTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  securityStatusText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: 4
  }
});
