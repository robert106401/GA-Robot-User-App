import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { getOptionIconLeading, getOptionLogoLeading, OptionListItem } from "../components/OptionListItem";
import { OptionTile } from "../components/OptionTile";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { colors, radii, spacing, statusColors, typography } from "../theme";
import { FriendRecord, GiftPurchaseResult } from "../types";
import { AppToastMessage } from "../feedback";

type GiftFlow = "voucher" | "ecard";
type GiftStep = "home" | "setup" | "details" | "review" | "success";

const voucherOptions = [
  { id: "any", title: "Any Drink", scope: "Any eligible drink", amount: 6, validDays: 30, icon: "gift-outline" as const },
  { id: "coffee", title: "Coffee", scope: "Any coffee", amount: 5, validDays: 14, icon: "cafe-outline" as const },
  { id: "milk-tea", title: "Milk Tea", scope: "Any milk tea", amount: 6, validDays: 14, icon: "water-outline" as const },
  { id: "double", title: "Double Drink", scope: "Any two drinks", amount: 10, validDays: 30, icon: "people-outline" as const }
];

const eCardOptions = [
  { id: "ecard-10", title: "$10 Wallet eCard", scope: "Stored value for drinks and app payments", amount: 10, icon: "wallet-outline" as const },
  { id: "ecard-25", title: "$25 Wallet eCard", scope: "A flexible treat for any day", amount: 25, icon: "card-outline" as const },
  { id: "ecard-50", title: "$50 Wallet eCard", scope: "Great for coffee runs and milk tea weeks", amount: 50, icon: "sparkles-outline" as const }
];

const occasions = ["Just Because", "Birthday", "Thank You", "Good Luck", "Celebration"];
const phoneCountryOptions = [
  { code: "+1", label: "US / Canada", example: "604 555 0123", groups: [3, 3, 4], maxDigits: 10 },
  { code: "+86", label: "China", example: "138 0013 8000", groups: [3, 4, 4], maxDigits: 11 },
  { code: "+852", label: "Hong Kong", example: "6123 4567", groups: [4, 4], maxDigits: 8 },
  { code: "+44", label: "UK", example: "7400 123 456", groups: [4, 3, 3], maxDigits: 10 }
] as const;
const defaultSenderName = "ROBERT HUI";

type GiftOccasion = {
  id: string;
  title: string;
  subtitle: string;
  occasion: string;
  message: string;
  recommendedFlow: GiftFlow;
  recommendation: string;
  sentCount: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  background: string;
};

const giftOccasions: GiftOccasion[] = [
  {
    id: "exam",
    title: "Exam Sprint",
    subtitle: "A focused boost before a big test.",
    occasion: "Good Luck",
    message: "You’ve got this. A little boost is on me.",
    recommendedFlow: "voucher",
    recommendation: "Drink Voucher recommended",
    sentCount: "1.4k sent",
    icon: "school-outline",
    accent: colors.warning,
    background: "#FFF5E6"
  },
  {
    id: "birthday",
    title: "Birthday",
    subtitle: "Let them choose their favorite treat.",
    occasion: "Birthday",
    message: "Happy birthday. Pick something you love!",
    recommendedFlow: "ecard",
    recommendation: "Wallet eCard recommended",
    sentCount: "2.8k sent",
    icon: "balloon-outline",
    accent: colors.berry,
    background: "#FFF0F5"
  },
  {
    id: "thanks",
    title: "Thank You",
    subtitle: "A simple drink-sized appreciation.",
    occasion: "Thank You",
    message: "Thank you. This one is on me.",
    recommendedFlow: "voucher",
    recommendation: "Any Drink Voucher recommended",
    sentCount: "1.9k sent",
    icon: "heart-outline",
    accent: colors.success,
    background: "#ECF9F2"
  },
  {
    id: "morning",
    title: "Good Morning",
    subtitle: "Start their day with coffee or tea.",
    occasion: "Just Because",
    message: "Good morning. Hope this makes today easier.",
    recommendedFlow: "voucher",
    recommendation: "Coffee Voucher recommended",
    sentCount: "980 sent",
    icon: "sunny-outline",
    accent: colors.coffee,
    background: colors.tint
  },
  {
    id: "celebration",
    title: "Congrats",
    subtitle: "A bigger moment deserves flexible value.",
    occasion: "Celebration",
    message: "Congratulations. Celebrate with something good!",
    recommendedFlow: "ecard",
    recommendation: "$25 eCard recommended",
    sentCount: "1.1k sent",
    icon: "sparkles-outline",
    accent: colors.blue,
    background: "#EEF5FF"
  },
  {
    id: "graduation",
    title: "Graduation",
    subtitle: "Mark the milestone with a fresh sip.",
    occasion: "Celebration",
    message: "So proud of you. Celebrate this milestone!",
    recommendedFlow: "ecard",
    recommendation: "$25 eCard recommended",
    sentCount: "760 sent",
    icon: "ribbon-outline",
    accent: "#7B61C7",
    background: "#F3F0FF"
  },
  {
    id: "new-job",
    title: "New Job",
    subtitle: "Fuel their first week and new routine.",
    occasion: "Celebration",
    message: "Congrats on the new role. First drink is on me!",
    recommendedFlow: "voucher",
    recommendation: "Coffee Voucher recommended",
    sentCount: "640 sent",
    icon: "briefcase-outline",
    accent: "#316B83",
    background: "#EEF8FA"
  },
  {
    id: "get-well",
    title: "Get Well",
    subtitle: "Send a gentle pick-me-up from afar.",
    occasion: "Just Because",
    message: "Thinking of you. Hope this brings a little comfort.",
    recommendedFlow: "voucher",
    recommendation: "Milk Tea Voucher recommended",
    sentCount: "520 sent",
    icon: "medkit-outline",
    accent: "#2D9C7A",
    background: "#EFFAF5"
  },
  {
    id: "miss-you",
    title: "Miss You",
    subtitle: "A small reminder that they matter.",
    occasion: "Just Because",
    message: "Miss you. Let’s share a drink soon.",
    recommendedFlow: "voucher",
    recommendation: "Any Drink Voucher recommended",
    sentCount: "870 sent",
    icon: "heart-circle-outline",
    accent: "#C45A7A",
    background: "#FFF1F5"
  },
  {
    id: "holiday",
    title: "Holiday Cheer",
    subtitle: "A seasonal treat for warm wishes.",
    occasion: "Celebration",
    message: "Wishing you a bright holiday. Enjoy something cozy!",
    recommendedFlow: "ecard",
    recommendation: "$25 eCard recommended",
    sentCount: "1.6k sent",
    icon: "snow-outline",
    accent: "#2F80A8",
    background: "#EEF9FF"
  },
  {
    id: "team-treat",
    title: "Team Treat",
    subtitle: "Celebrate a teammate or small win.",
    occasion: "Thank You",
    message: "Thanks for the great work. This treat is on me.",
    recommendedFlow: "voucher",
    recommendation: "Double Drink Voucher recommended",
    sentCount: "430 sent",
    icon: "people-outline",
    accent: "#87643E",
    background: "#FFF7EA"
  },
  {
    id: "just-because",
    title: "Just Because",
    subtitle: "No occasion needed for a small surprise.",
    occasion: "Just Because",
    message: "A treat is on me. Enjoy!",
    recommendedFlow: "voucher",
    recommendation: "Any Drink Voucher recommended",
    sentCount: "2.1k sent",
    icon: "gift-outline",
    accent: colors.ink,
    background: colors.surface
  }
];

type GiftSelection = {
  title: string;
  amount: number;
  skuId?: string;
  redemptionScope?: string;
  validDays?: number;
};

export type GiftCashierRequest = Omit<GiftPurchaseResult, "paymentMethod" | "paymentMethodId">;

type GiftScreenProps = {
  walletBalance: number;
  friends: FriendRecord[];
  pointsBalance: number;
  pointsInstantRedeemEnabled: boolean;
  onOpenSentGifts: () => void;
  onOpenCashier: (
    request: GiftCashierRequest,
    callbacks: {
      onSuccess: (giftCode: string) => void;
      onCancel: () => void;
      onFailure: () => void;
    }
  ) => void;
  xpBalance: number;
  onShowToast: (toast: AppToastMessage, duration?: number) => void;
};

export function GiftScreen({
  walletBalance,
  friends,
  pointsBalance,
  pointsInstantRedeemEnabled,
  onOpenSentGifts,
  onOpenCashier,
  xpBalance,
  onShowToast
}: GiftScreenProps) {
  const [flow, setFlow] = useState<GiftFlow>("voucher");
  const [step, setStep] = useState<GiftStep>("home");
  const [selection, setSelection] = useState<GiftSelection | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientCountryCode, setRecipientCountryCode] = useState("+1");
  const [recipientContact, setRecipientContact] = useState("");
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [message, setMessage] = useState("A treat is on me. Enjoy!");
  const [occasion, setOccasion] = useState(occasions[0]);
  const [sentGiftCode, setSentGiftCode] = useState("");
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [setupSession, setSetupSession] = useState(0);
  const defaultBenefitId = pointsInstantRedeemEnabled ? "points" : "none";
  const [selectedBenefitId, setSelectedBenefitId] = useState<"points" | "none">(defaultBenefitId);

  function selectFriend(friend: FriendRecord) {
    const parsedPhone = parsePhoneNumber(friend.phone);
    setRecipientName(friend.name);
    setRecipientCountryCode(parsedPhone.countryCode);
    setRecipientContact(parsedPhone.localNumber);
  }

  function selectCountryCode(countryCode: string) {
    setRecipientCountryCode(countryCode);
    setRecipientContact((value) => formatLocalPhoneNumber(value, countryCode));
    setIsCountryPickerOpen(false);
  }

  function resetFlow() {
    setStep("home");
    setSelection(null);
    setSelectedOccasion(null);
    setRecipientName("");
    setRecipientCountryCode("+1");
    setRecipientContact("");
    setSenderName(defaultSenderName);
    setMessage("A treat is on me. Enjoy!");
    setOccasion(occasions[0]);
    setSentGiftCode("");
    setIsCountryPickerOpen(false);
    setIsSending(false);
    setSetupSession(0);
    setSelectedBenefitId(defaultBenefitId);
  }

  function chooseOccasion(nextOccasion: GiftOccasion) {
    setSelectedOccasion(nextOccasion);
    setOccasion(nextOccasion.occasion);
    setMessage(nextOccasion.message);
    setFlow(nextOccasion.recommendedFlow);
    setSelection(null);
    setSetupSession((value) => value + 1);
    setSelectedBenefitId(defaultBenefitId);
    setStep("setup");
  }

  function startFlow(nextFlow: GiftFlow) {
    setFlow(nextFlow);
    setSelection(null);
    setSelectedBenefitId(defaultBenefitId);
  }

  function selectVoucher(voucher: (typeof voucherOptions)[number]) {
    setSelection({
      title: voucher.title,
      amount: voucher.amount,
      redemptionScope: voucher.scope,
      validDays: voucher.validDays
    });
  }

  function selectECard(ecard: (typeof eCardOptions)[number]) {
    setSelection({
      title: ecard.title,
      amount: ecard.amount,
      redemptionScope: ecard.scope
    });
  }

  if (step === "setup" && selectedOccasion) {
    return (
      <Screen
        key={`gift-setup-${selectedOccasion.id}-${setupSession}`}
        title={selectedOccasion.title}
        eyebrow="Choose gift style"
        scrollKey={`gift-setup-${selectedOccasion.id}-${setupSession}`}
        onBack={() => setStep("home")}
        backLabel="Back to Gift"
        bottomAction={
          selection ? (
            <BottomActionBar>
              <BottomActionSummary
                label={`${flow === "voucher" ? "Voucher" : "eCard"} Selected`}
                value={formatCurrency(selection.amount)}
                meta={selection.validDays ? `Expires ${formatVoucherExpiryDate(selection.validDays)}` : "Flexible stored value"}
              />
              <BottomActionButton label="Continue" icon="arrow-forward" onPress={() => setStep("details")} />
            </BottomActionBar>
          ) : null
        }
      >
        <AppCard style={[styles.occasionContextCard, { backgroundColor: selectedOccasion.background, borderColor: selectedOccasion.accent }]}>
          <View style={[styles.occasionContextIcon, { backgroundColor: selectedOccasion.accent }]}>
            <Ionicons name={selectedOccasion.icon} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.occasionContextCopy}>
            <Text style={styles.occasionContextTitle}>{selectedOccasion.title}</Text>
            <Text style={styles.occasionContextText}>{selectedOccasion.subtitle}</Text>
          </View>
        </AppCard>

        <SectionHeader title="Gift Style" />
        <View style={styles.entryRow}>
          <GiftMethodCard
            selected={flow === "voucher"}
            recommended={selectedOccasion.recommendedFlow === "voucher"}
            title="Drink Voucher"
            text="Redeem one eligible drink at a VM."
            icon="ticket-outline"
            accent={colors.blue}
            onPress={() => startFlow("voucher")}
          />
          <GiftMethodCard
            selected={flow === "ecard"}
            recommended={selectedOccasion.recommendedFlow === "ecard"}
            title="Wallet eCard"
            text="Flexible stored value for app payments."
            icon="wallet-outline"
            accent={colors.berry}
            onPress={() => startFlow("ecard")}
          />
        </View>

        <SectionHeader title={flow === "voucher" ? "Choose a Voucher" : "Choose eCard Value"} />
        <View style={[styles.optionList, styles.giftSetupOptionList]}>
          {flow === "voucher"
            ? voucherOptions.map((voucher) => {
                const selected = selection?.title === voucher.title && selection.amount === voucher.amount;
                  return (
                    <OptionListItem
                      key={voucher.id}
                      variant="valueSelect"
                      style={styles.optionListItem}
                      selected={selected}
                      leading={getOptionIconLeading({
                        icon: voucher.icon,
                        selected
                      })}
                      title={voucher.title}
                      text={voucher.scope}
                      rightMeta={`${voucher.validDays} DAYS`}
                      rightValue={`$${voucher.amount}`}
                      onPress={() => selectVoucher(voucher)}
                    />
                  );
              })
            : eCardOptions.map((ecard) => {
                const selected = selection?.title === ecard.title && selection.amount === ecard.amount;
                  return (
                    <OptionListItem
                      key={ecard.id}
                      variant="valueSelect"
                      style={styles.optionListItem}
                      selected={selected}
                      leading={getOptionIconLeading({
                        icon: ecard.icon,
                        selected,
                        backgroundColor: statusColors.success.subtleBackground,
                        color: colors.success
                      })}
                      title={ecard.title}
                      text={ecard.scope}
                      rightValue={`$${ecard.amount}`}
                      onPress={() => selectECard(ecard)}
                    />
                  );
              })}
        </View>
      </Screen>
    );
  }

  function sendGift() {
    if (!selection || isSending) {
      return;
    }
    const formattedPhone = formatFullPhoneNumber(recipientCountryCode, recipientContact);
    const pointsBenefit = pointsInstantRedeemEnabled
      ? calculateInstantPointsBenefit(selection.amount, pointsBalance)
      : { valueApplied: 0, pointsCost: 0, payableAmount: selection.amount };
    const usePointsBenefit = pointsInstantRedeemEnabled && selectedBenefitId === "points" && pointsBenefit.pointsCost > 0;
    setIsSending(true);
    onOpenCashier({
      kind: flow,
      title: selection.title,
      recipientName: recipientName.trim(),
      recipientContact: formattedPhone,
      message: message.trim(),
      occasion,
      amount: selection.amount,
      payableAmount: usePointsBenefit ? pointsBenefit.payableAmount : selection.amount,
      benefitsApplied: usePointsBenefit ? [{
        id: "points-instant-redeem",
        type: "Points",
        title: "Use Points",
        valueApplied: pointsBenefit.valueApplied,
        pointsCost: pointsBenefit.pointsCost
      }] : [],
      pointsRedeemed: usePointsBenefit ? pointsBenefit.pointsCost : 0,
      skuId: selection.skuId,
      redemptionScope: selection.redemptionScope,
      validDays: selection.validDays
    }, {
      onSuccess: (giftCode) => {
        setSentGiftCode(giftCode);
        setIsSending(false);
        setStep("success");
      },
      onCancel: () => {
        setIsSending(false);
      },
      onFailure: () => {
        setIsSending(false);
        onShowToast({
          tone: "warning",
          title: "Gift not sent",
          message: "Choose another payment method or add funds.",
          icon: "wallet-outline"
        });
      }
    });
  }

  if (step === "details" && selection) {
    const selectedPhoneCountry = getPhoneCountryOption(recipientCountryCode);
    const phoneEntered = recipientContact.trim().length > 0;
    const phoneValid = isValidPhoneNumber(recipientCountryCode, recipientContact);
    const detailsValid = recipientName.trim().length > 0 && senderName.trim().length > 0 && phoneValid;
    const pointsBenefit = pointsInstantRedeemEnabled
      ? calculateInstantPointsBenefit(selection.amount, pointsBalance)
      : { valueApplied: 0, pointsCost: 0, payableAmount: selection.amount };
    const usePointsBenefit = pointsInstantRedeemEnabled && selectedBenefitId === "points" && pointsBenefit.pointsCost > 0;
    const payableAmount = usePointsBenefit ? pointsBenefit.payableAmount : selection.amount;
    return (
      <Screen
        title="Personalize Gift"
        eyebrow={selection.title}
        scrollKey={`gift-details-${selection.title}`}
        onBack={() => setStep("setup")}
        backLabel="Back to Selection"
        bottomAction={
          <BottomActionBar>
            <BottomActionSummary
              label="Payable After Benefits"
              value={formatCurrency(payableAmount)}
              meta={usePointsBenefit ? `${pointsBenefit.pointsCost.toLocaleString("en-US")} Points applied` : "No Benefit"}
            />
            <BottomActionButton
              label={isSending ? "Opening…" : "Continue"}
              icon="lock-closed-outline"
              disabled={!detailsValid || isSending}
              loading={isSending}
              onPress={sendGift}
            />
          </BottomActionBar>
        }
      >
        {friends.length ? (
          <>
            <SectionHeader title="Choose Recipient" />
            <View style={styles.friendPickerList}>
              {friends.map((friend) => {
                const selected = getPhoneDigits(formatFullPhoneNumber(recipientCountryCode, recipientContact)) === getPhoneDigits(friend.phone);
                return (
                  <OptionListItem
                    key={friend.id}
                    variant="select"
                    density="compact"
                    style={styles.friendPickerCard}
                    leading={getOptionLogoLeading({
                      label: friend.name.slice(0, 1).toUpperCase(),
                      selected
                    })}
                    title={friend.name}
                    text={`${friend.relationship} · ${friend.phone}`}
                    selected={selected}
                    onPress={() => selectFriend(friend)}
                  />
                );
              })}
            </View>
          </>
        ) : null}
        {pointsInstantRedeemEnabled && pointsBenefit.pointsCost ? (
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
                value={formatCurrency(selection.amount)}
                muted
                onPress={() => setSelectedBenefitId("none")}
              />
            </ScrollView>
          </>
        ) : null}
        <SectionHeader title="Recipient" />
        <Text style={styles.fieldLabel}>Recipient name</Text>
        <TextInput
          style={styles.input}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="e.g. Jamie"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.fieldLabel}>Mobile number</Text>
        <View style={styles.phoneInputRow}>
          <TouchableOpacity
            style={styles.phoneCountryPrefix}
            activeOpacity={0.84}
            onPress={() => setIsCountryPickerOpen(true)}
          >
            <Text style={styles.phoneCountryPrefixText}>{recipientCountryCode}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.muted} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.phoneNumberInput]}
            value={recipientContact}
            onChangeText={(value) => setRecipientContact(formatLocalPhoneNumber(value, recipientCountryCode))}
            placeholder={selectedPhoneCountry.example}
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.phoneValidationRow}>
          <Ionicons
            name={phoneValid ? "checkmark-circle" : "information-circle-outline"}
            size={14}
            color={!phoneEntered || phoneValid ? colors.muted : statusColors.danger.text}
          />
          <Text style={[styles.phoneValidationText, phoneEntered && !phoneValid && styles.phoneValidationTextError]}>
            {phoneEntered && !phoneValid
              ? `Enter a valid ${selectedPhoneCountry.label} mobile number.`
            : `Format: ${recipientCountryCode} ${selectedPhoneCountry.example}`}
          </Text>
        </View>
        <Modal
          transparent
          visible={isCountryPickerOpen}
          animationType="fade"
          onRequestClose={() => setIsCountryPickerOpen(false)}
        >
          <View style={styles.countryPickerRoot}>
            <TouchableOpacity
              style={styles.countryPickerBackdrop}
              activeOpacity={1}
              onPress={() => setIsCountryPickerOpen(false)}
            />
            <View style={styles.countryPickerSheet}>
              <View style={styles.countryPickerHeader}>
                <Text style={styles.countryPickerTitle}>Country code</Text>
                <TouchableOpacity
                  style={styles.countryPickerClose}
                  activeOpacity={0.84}
                  onPress={() => setIsCountryPickerOpen(false)}
                >
                  <Ionicons name="close" size={18} color={colors.ink} />
                </TouchableOpacity>
              </View>
              <View style={styles.countryPickerList}>
                {phoneCountryOptions.map((country) => {
                  const selected = recipientCountryCode === country.code;
                  return (
                  <OptionListItem
                    key={country.code}
                    variant="select"
                    density="compact"
                      style={styles.countryPickerItem}
                      leading={getOptionLogoLeading({
                        label: country.code,
                        selected,
                        color: colors.ink
                      })}
                      title={country.label}
                      text={country.example}
                      selected={selected}
                      onPress={() => selectCountryCode(country.code)}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
        <SectionHeader title="Sender" />
        <Text style={styles.fieldLabel}>From</Text>
        <TextInput
          style={styles.input}
          value={senderName}
          onChangeText={setSenderName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.fieldLabel}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Write a short message"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={120}
        />
        <Text style={styles.characterCount}>{message.length}/120</Text>
      </Screen>
    );
  }

  if (step === "success" && selection) {
    return (
      <Screen title="Gift Sent" eyebrow="Ready to Claim" scrollKey="gift-success">
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Your gift is on its way</Text>
        </View>
        <GiftVoucher
          kind={flow}
          title={selection.title}
          recipientName={recipientName}
          senderName={senderName}
          message={message}
          occasion={occasion}
          redemptionScope={selection.redemptionScope}
          validDays={selection.validDays}
          giftCode={sentGiftCode}
          stateLabel="ACTIVE VOUCHER"
        />
        <TouchableOpacity style={styles.primaryAction} onPress={resetFlow}>
          <Text style={styles.primaryActionText}>Back to Gift</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen
      title="Gift"
      eyebrow="Start with the moment"
      scrollKey="gift-home"
      trailing={(
        <TouchableOpacity
          style={styles.headerShortcut}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel="Open sent gifts"
          onPress={onOpenSentGifts}
        >
          <Ionicons name="gift-outline" size={22} color={colors.blue} />
        </TouchableOpacity>
      )}
    >
      <View style={styles.campaignHero}>
        <View style={styles.campaignCopy}>
          <Text style={styles.campaignEyebrow}>CELEBRATE THE MOMENT</Text>
          <Text style={styles.campaignTitle}>A small drink can make a big day.</Text>
          <Text style={styles.campaignText}>Send instantly for birthdays, exams, milestones, or no reason at all.</Text>
        </View>
        <View style={styles.campaignArt}>
          <Ionicons name="gift" size={48} color="#FFFFFF" />
          <Ionicons name="sparkles" size={22} color={colors.milk} style={styles.sparkleIcon} />
        </View>
      </View>

      <SectionHeader title="Gift Moments" />
      <View style={styles.occasionGrid}>
        {giftOccasions.map((giftOccasion) => (
          <GiftMomentCard
            key={giftOccasion.id}
            occasion={giftOccasion}
            onPress={() => chooseOccasion(giftOccasion)}
          />
        ))}
      </View>
    </Screen>
  );
}

function GiftMomentCard({
  occasion,
  onPress
}: {
  occasion: GiftOccasion;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      accessibilityRole="button"
      style={[
        styles.occasionCard,
        {
          backgroundColor: occasion.background,
          borderColor: occasion.accent
        }
      ]}
      onPress={onPress}
    >
      <View style={[styles.occasionAccentBar, { backgroundColor: occasion.accent }]} />
      <View style={[styles.occasionGlow, { backgroundColor: occasion.accent }]} />
      <View style={styles.occasionCardHeader}>
        <View style={[styles.occasionIconWrap, { borderColor: occasion.accent }]}>
          <Ionicons name={occasion.icon} size={20} color={occasion.accent} />
        </View>
        <View style={[styles.occasionFlowBadge, { borderColor: occasion.accent }]}>
          <Text style={[styles.occasionFlowText, { color: occasion.accent }]} numberOfLines={1}>
            {occasion.sentCount}
          </Text>
        </View>
      </View>
      <Text style={styles.occasionTitle} numberOfLines={1}>
        {occasion.title}
      </Text>
      <Text style={styles.occasionCardText} numberOfLines={2}>
        {occasion.subtitle}
      </Text>
      <View style={styles.occasionFooter}>
        <Text style={[styles.occasionFooterText, { color: occasion.accent }]}>Send Gift</Text>
        <Ionicons name="arrow-forward" size={13} color={occasion.accent} />
      </View>
    </TouchableOpacity>
  );
}

function GiftMethodCard({
  selected,
  recommended,
  title,
  text,
  icon,
  accent,
  onPress
}: {
  selected: boolean;
  recommended: boolean;
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.entryCard,
        styles.methodCard,
        selected && { borderColor: accent, backgroundColor: "rgba(255,255,255,0.94)" }
      ]}
      activeOpacity={0.84}
      onPress={onPress}
    >
      {selected ? <View style={[styles.methodSelectedBar, { backgroundColor: accent }]} /> : null}
      {recommended ? (
        <View style={[styles.recommendedBadge, { backgroundColor: accent }]}>
          <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
        </View>
      ) : null}
      {selected ? (
        <View style={[styles.methodSelectedMark, { backgroundColor: accent }]}>
          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
        </View>
      ) : null}
      <Ionicons name={icon} size={28} color={accent} />
      <Text style={styles.entryTitle}>{title}</Text>
      <Text style={styles.entryText}>{text}</Text>
      <View style={styles.entryLink}>
        <Text style={[styles.entryLinkText, { color: accent }]}>{selected ? "Selected" : "Choose"}</Text>
        {selected ? null : <Ionicons name="arrow-forward" size={15} color={accent} />}
      </View>
    </TouchableOpacity>
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

function GiftVoucher({
  kind,
  title,
  recipientName,
  senderName,
  message,
  occasion,
  redemptionScope,
  validDays,
  giftCode,
  stateLabel
}: {
  kind: GiftFlow;
  title: string;
  recipientName: string;
  senderName: string;
  message: string;
  occasion: string;
  redemptionScope?: string;
  validDays?: number;
  giftCode?: string;
  stateLabel?: string;
}) {
  const isIssued = Boolean(giftCode);
  const palette = getVoucherPalette(occasion);
  const expiryDate = formatVoucherExpiryDate(validDays ?? 30);

  return (
    <View style={styles.voucher}>
      <View style={[styles.voucherMain, { backgroundColor: palette.background, borderColor: palette.accent }]}>
        <View style={[styles.voucherDecorCircle, styles.voucherDecorCircleLarge, { borderColor: palette.soft }]} />
        <View style={[styles.voucherDecorCircle, styles.voucherDecorCircleSmall, { borderColor: palette.soft }]} />
        <View style={[styles.voucherDecorBar, { backgroundColor: palette.soft }]} />

        <View style={styles.voucherHeader}>
          <View style={styles.voucherTitleGroup}>
            <Text style={styles.voucherOccasion}>{occasion.toUpperCase()}</Text>
            <Text style={styles.voucherTitle} numberOfLines={2}>{title}</Text>
          </View>
          <View style={styles.voucherHeaderRight}>
            {stateLabel ? (
              <View style={[styles.voucherStatePill, !isIssued && styles.voucherStatePillPreview]}>
                <Text style={styles.voucherStateText}>{stateLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.voucherBody}>
          <View style={styles.voucherCopy}>
            <Text style={styles.voucherRecipient} numberOfLines={1}>To {recipientName}</Text>
            <Text style={styles.voucherSender} numberOfLines={1}>From {senderName}</Text>
            <Text style={styles.voucherMessage} numberOfLines={2}>“{message || "Enjoy your gift!"}”</Text>
          </View>
          <View style={styles.voucherVisual}>
            <View style={[styles.voucherVisualMark, { backgroundColor: palette.soft }]}>
              <Ionicons name={palette.icon} size={31} color="#FFFFFF" />
            </View>
            <View style={styles.voucherExpiry}>
              <Text style={styles.voucherExpiryLabel}>EXPIRES</Text>
              <Text style={styles.voucherExpiryDate}>{expiryDate}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.voucherStubConnector}>
        {Array.from({ length: 65 }, (_, index) => (
          <View
            key={`voucher-stub-dot-${index}`}
            style={[styles.voucherStubDot, { backgroundColor: palette.accent }]}
          />
        ))}
      </View>

      <View style={[styles.voucherCodePanel, { backgroundColor: palette.background, borderColor: palette.accent }]}>
        <View style={styles.voucherCodeRow}>
          <Text style={styles.voucherCodeLabel}>GIFT CODE</Text>
          <Text style={[styles.voucherCode, !isIssued && styles.voucherCodePending]}>
            {giftCode ?? "Code issued after payment"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getVoucherPalette(occasion: string): {
  background: string;
  accent: string;
  soft: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  switch (occasion) {
    case "Birthday":
      return { background: "#D94F78", accent: "#B7365E", soft: "rgba(255,255,255,0.20)", icon: "balloon-outline" };
    case "Thank You":
      return { background: "#258C8A", accent: "#187170", soft: "rgba(255,255,255,0.20)", icon: "heart-outline" };
    case "Good Luck":
      return { background: "#E8753D", accent: "#C85A29", soft: "rgba(255,255,255,0.20)", icon: "ribbon-outline" };
    case "Celebration":
      return { background: "#7158A6", accent: "#59418B", soft: "rgba(255,255,255,0.20)", icon: "sparkles-outline" };
    default:
      return { background: "#167FA3", accent: "#0E6687", soft: "rgba(255,255,255,0.20)", icon: "cafe-outline" };
  }
}

function formatVoucherExpiryDate(validDays: number) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validDays);
  return expiryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).toUpperCase();
}

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getPhoneCountryOption(countryCode: string) {
  return phoneCountryOptions.find((country) => country.code === countryCode) ?? phoneCountryOptions[0];
}

function getLocalPhoneDigits(value: string, countryCode: string) {
  const digits = getPhoneDigits(value);
  const country = getPhoneCountryOption(countryCode);
  const countryDigits = getPhoneDigits(country.code);

  if (value.trim().startsWith(country.code) || digits.length > country.maxDigits && digits.startsWith(countryDigits)) {
    return digits.slice(countryDigits.length, countryDigits.length + country.maxDigits);
  }

  return digits.slice(0, country.maxDigits);
}

function formatLocalPhoneNumber(value: string, countryCode: string) {
  const country = getPhoneCountryOption(countryCode);
  const localDigits = getLocalPhoneDigits(value, country.code);
  if (!localDigits.length) {
    return "";
  }

  const groupedDigits: string[] = [];
  let cursor = 0;
  country.groups.forEach((groupSize) => {
    const part = localDigits.slice(cursor, cursor + groupSize);
    if (part) {
      groupedDigits.push(part);
    }
    cursor += groupSize;
  });
  return groupedDigits.join(" ");
}

function formatFullPhoneNumber(countryCode: string, localNumber: string) {
  const country = getPhoneCountryOption(countryCode);
  const formattedLocalNumber = formatLocalPhoneNumber(localNumber, country.code);
  return formattedLocalNumber ? `${country.code} ${formattedLocalNumber}` : country.code;
}

function parsePhoneNumber(value: string) {
  const trimmedValue = value.trim();
  const digits = getPhoneDigits(trimmedValue);
  const matchedCountry = phoneCountryOptions.find((country) => {
    const countryDigits = getPhoneDigits(country.code);
    return trimmedValue.startsWith(country.code) || digits.length > country.maxDigits && digits.startsWith(countryDigits);
  }) ?? phoneCountryOptions[0];

  return {
    countryCode: matchedCountry.code,
    localNumber: formatLocalPhoneNumber(trimmedValue, matchedCountry.code)
  };
}

function isValidPhoneNumber(countryCode: string, value: string) {
  const localDigits = getLocalPhoneDigits(value, countryCode);
  switch (countryCode) {
    case "+86":
      return /^1[3-9]\d{9}$/.test(localDigits);
    case "+852":
      return /^[569]\d{7}$/.test(localDigits);
    case "+44":
      return /^7\d{9}$/.test(localDigits);
    default:
      return /^[2-9]\d{2}[2-9]\d{6}$/.test(localDigits);
  }
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
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

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

const styles = StyleSheet.create({
  campaignHero: {
    minHeight: 184,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: radii.md,
    backgroundColor: colors.ink
  },
  campaignCopy: { flex: 1, zIndex: 2 },
  campaignEyebrow: { color: colors.milk, fontSize: 10, fontWeight: "700" },
  campaignTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 28, fontWeight: "700", marginTop: 8 },
  campaignText: { color: "rgba(255,255,255,0.76)", fontSize: 12, lineHeight: 17, marginTop: 8 },
  campaignArt: {
    width: 92,
    height: 92,
    marginLeft: 12,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.berry
  },
  sparkleIcon: { position: "absolute", right: -4, top: 2 },
  entryRow: { flexDirection: "row", gap: 10 },
  entryCard: { flex: 1, minHeight: 164, padding: 14, borderRadius: radii.md, borderWidth: 1 },
  methodCard: { position: "relative", overflow: "hidden", backgroundColor: colors.surface, borderColor: colors.line },
  methodSelectedBar: { position: "absolute", left: 0, right: 0, top: 0, height: 5 },
  methodSelectedMark: { position: "absolute", right: 10, bottom: 10, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  voucherEntry: { backgroundColor: statusColors.info.background, borderColor: statusColors.info.border },
  drinkEntry: { backgroundColor: statusColors.danger.background, borderColor: statusColors.danger.border },
  entryTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700", marginTop: 12 },
  entryText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  entryLink: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 4 },
  entryLinkText: { color: colors.blue, fontSize: 11, fontWeight: "700" },
  recommendedBadge: { position: "absolute", right: 10, top: 10, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  recommendedBadgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
  occasionContextCard: { minHeight: 86, flexDirection: "row", alignItems: "center", gap: 12 },
  occasionContextIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  occasionContextCopy: { flex: 1 },
  occasionContextTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  occasionContextText: { color: colors.muted, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 4 },
  occasionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  occasionCard: {
    position: "relative",
    width: "48.5%",
    minHeight: 154,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 11,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  occasionAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.9
  },
  occasionGlow: {
    position: "absolute",
    width: 92,
    height: 92,
    right: -34,
    top: -30,
    borderRadius: 46,
    opacity: 0.12
  },
  occasionCardHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8
  },
  occasionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.58)"
  },
  occasionFlowBadge: {
    minHeight: 22,
    maxWidth: 86,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.58)"
  },
  occasionFlowText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.1 },
  occasionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 11 },
  occasionCardText: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: 5 },
  occasionFooter: {
    marginTop: "auto",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  occasionFooterText: { fontSize: 10, fontWeight: "800" },
  momentRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  momentItem: { flex: 1, alignItems: "center", gap: 6 },
  momentIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: colors.tint },
  momentLabel: { color: colors.ink, fontSize: 10, fontWeight: "600", textAlign: "center" },
  optionList: { gap: 10 },
  giftSetupOptionList: { minHeight: 358 },
  optionListItem: { minHeight: 82, marginBottom: 0 },
  walletPaymentOption: { backgroundColor: statusColors.success.background, borderColor: statusColors.success.border },
  voucherOption: { minHeight: 82, position: "relative", overflow: "hidden", paddingHorizontal: 12, paddingVertical: 11 },
  voucherOptionSelected: { borderColor: colors.success, borderWidth: 1.5, backgroundColor: statusColors.success.background },
  optionSelectedBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: colors.success },
  voucherOptionGrid: { minHeight: 58, flexDirection: "row", alignItems: "center", columnGap: 10 },
  optionIcon: { width: 46, height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint },
  optionIconSelected: { backgroundColor: colors.success },
  optionCopy: { flex: 1 },
  voucherNameColumn: { flex: 1, minWidth: 0, justifyContent: "center" },
  eCardOptionIcon: { backgroundColor: statusColors.success.subtleBackground },
  optionTitle: { color: colors.ink, ...typography.label },
  validityColumn: { width: 82, alignItems: "flex-start", justifyContent: "center" },
  eCardValidityColumn: { width: 82 },
  amountColumn: { width: 42, alignItems: "flex-end", justifyContent: "center" },
  optionRight: { alignItems: "flex-end", gap: 5 },
  optionSubtitle: { color: colors.muted, ...typography.bodySmall, marginTop: 4 },
  fieldLabel: { color: colors.ink, ...typography.label, marginTop: 16, marginBottom: 7 },
  input: { minHeight: 48, paddingHorizontal: 13, color: colors.ink, fontSize: 13, borderRadius: radii.md, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  phoneInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  phoneCountryPrefix: { width: 76, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radii.md, backgroundColor: colors.tint, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  phoneCountryPrefixText: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  phoneNumberInput: { flex: 1 },
  phoneValidationRow: { marginTop: 7, flexDirection: "row", alignItems: "center", gap: 5 },
  phoneValidationText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  phoneValidationTextError: { color: statusColors.danger.text },
  countryPickerRoot: { flex: 1, justifyContent: "flex-end" },
  countryPickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  countryPickerSheet: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 22, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: colors.canvas, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  countryPickerHeader: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  countryPickerTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  countryPickerClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  countryPickerList: { gap: 8 },
  countryPickerItem: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radii.md, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  countryPickerCopy: { width: 96 },
  countryPickerCode: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  countryPickerLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
  countryPickerExample: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  messageInput: { minHeight: 100, paddingTop: 12, textAlignVertical: "top" },
  characterCount: { color: colors.muted, fontSize: 10, textAlign: "right", marginTop: 5 },
  friendPickerList: { gap: 8 },
  friendPickerCard: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 10 },
  benefitChoiceList: { gap: 9, paddingRight: spacing.md },
  benefitCard: { width: 138, minHeight: 104, padding: 10, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surface },
  benefitCardSelected: { borderColor: colors.success, borderWidth: 1.5, backgroundColor: statusColors.success.background },
  benefitTop: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  benefitIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint },
  benefitIconSelected: { backgroundColor: colors.success },
  benefitTitle: { color: colors.ink, fontSize: 13, lineHeight: 17, fontWeight: "800", marginTop: 9 },
  benefitText: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: "700", marginTop: 3 },
  benefitTextSelected: { color: colors.success },
  benefitSelectedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
  benefitSelectedText: { color: colors.success, fontSize: 11, lineHeight: 14, fontWeight: "800" },
  friendPickerCopy: { flex: 1 },
  friendPickerName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  friendPickerMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  profilePillRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  profilePill: { minHeight: 34, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  profilePillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  profilePillText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  profilePillTextSelected: { color: "#FFFFFF" },
  saveFriendRow: { minHeight: 60, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 10 },
  friendCheckbox: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.canvas },
  friendCheckboxSelected: { backgroundColor: colors.success, borderColor: colors.success },
  saveFriendCopy: { flex: 1 },
  saveFriendTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  saveFriendText: { color: colors.muted, fontSize: 11, fontWeight: "600", marginTop: 3 },
  occasionRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  occasionPill: { minHeight: 34, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth },
  occasionPillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  occasionText: { color: colors.ink, fontSize: 11, fontWeight: "600" },
  occasionTextSelected: { color: "#FFFFFF" },
  voucher: { overflow: "visible", backgroundColor: "transparent" },
  voucherMain: { width: "100%", aspectRatio: 1.9, paddingHorizontal: 18, paddingVertical: 13, overflow: "hidden", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, zIndex: 2, elevation: 2 },
  voucherHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  voucherTitleGroup: { flex: 1, alignItems: "flex-start" },
  voucherOccasion: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  voucherHeaderRight: { alignItems: "flex-end", justifyContent: "flex-start" },
  voucherStatePill: { minHeight: 22, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.24)" },
  voucherStatePillPreview: { backgroundColor: "rgba(255,255,255,0.16)" },
  voucherStateText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  voucherBody: { flex: 1, marginTop: 8, flexDirection: "row", alignItems: "stretch", gap: 12 },
  voucherCopy: { flex: 1, justifyContent: "center" },
  voucherTitle: { color: "#FFFFFF", fontSize: 22, lineHeight: 26, fontWeight: "900", marginTop: 2 },
  voucherRecipient: { color: "rgba(255,255,255,0.88)", fontSize: 15, fontWeight: "900" },
  voucherSender: { color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: "800", marginTop: 4 },
  voucherMessage: { color: "#FFFFFF", fontSize: 12, lineHeight: 16, fontStyle: "italic", marginTop: 8 },
  voucherVisual: { width: 92, alignItems: "center", justifyContent: "center", paddingLeft: 10, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: "rgba(255,255,255,0.24)" },
  voucherVisualMark: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  voucherExpiry: { marginTop: 7, alignItems: "center" },
  voucherExpiryLabel: { color: "rgba(255,255,255,0.70)", fontSize: 8, fontWeight: "800" },
  voucherExpiryDate: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", marginTop: 3, textAlign: "center" },
  voucherDecorCircle: { position: "absolute", borderWidth: 2 },
  voucherDecorCircleLarge: { width: 142, height: 142, borderRadius: 71, right: -54, bottom: -58 },
  voucherDecorCircleSmall: { width: 72, height: 72, borderRadius: 36, right: 28, bottom: -26 },
  voucherDecorBar: { position: "absolute", width: 100, height: 4, right: -28, top: 63, transform: [{ rotate: "-42deg" }] },
  voucherStubConnector: { height: 6, marginVertical: -3, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 3 },
  voucherStubDot: { width: 1.5, height: 1.5, borderRadius: 0.75, opacity: 0.95 },
  voucherCodePanel: { width: "100%", minHeight: 50, paddingHorizontal: 18, paddingVertical: 8, justifyContent: "center", borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 0, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.14, shadowRadius: 9, elevation: 4 },
  voucherCodeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  voucherCodeLabel: { color: "rgba(255,255,255,0.68)", fontSize: 8, fontWeight: "800" },
  voucherCode: { flexShrink: 1, color: "#FFFFFF", fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: 0, textAlign: "right" },
  voucherCodePending: { color: "#F7D6A1", fontSize: 12 },
  deliveryCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  deliveryCopy: { flex: 1 },
  deliveryTitle: { color: colors.ink, ...typography.label },
  deliveryText: { color: colors.muted, ...typography.bodySmall, marginTop: 4 },
  successHeader: { alignItems: "center", paddingVertical: 18 },
  successIcon: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: colors.success },
  successTitle: { color: colors.ink, fontSize: 22, fontWeight: "700", marginTop: 18 },
  primaryAction: { minHeight: 52, marginTop: 14, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.ink },
  primaryActionText: { color: "#FFFFFF", ...typography.button },
  headerShortcut: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: colors.tint, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth }
});
