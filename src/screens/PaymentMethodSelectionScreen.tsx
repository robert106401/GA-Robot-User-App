import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCardExpiryInput, formatCardNumberInput, isValidCardExpiry } from "../cardInput";
import { InlineNotice } from "../components/InlineNotice";
import { OptionListItem } from "../components/OptionListItem";
import { Screen } from "../components/Screen";
import { paymentMethods, PaymentMethod, PaymentMethodId, PaymentMethodMode, SavedPaymentCard } from "../paymentMethods";
import { colors, radii, spacing, statusColors } from "../theme";

type PaymentMethodSelectionScreenProps = {
  mode: PaymentMethodMode;
  selectedPayment: PaymentMethodId;
  walletBalance: number;
  payable?: number;
  availableMethods: PaymentMethod[];
  initialPage?: "list" | "add-method";
  onBack: () => void;
  onSelect: (methodId: PaymentMethodId) => void;
  onAddPaymentMethod?: (methodId: PaymentMethodId, card?: SavedPaymentCard, makeDefault?: boolean) => void;
};

export function PaymentMethodSelectionScreen({
  mode,
  selectedPayment,
  walletBalance,
  payable = 0,
  availableMethods,
  initialPage = "list",
  onBack,
  onSelect,
  onAddPaymentMethod
}: PaymentMethodSelectionScreenProps) {
  const [page, setPage] = useState<"list" | "add-method" | "add-card">(initialPage);
  const [cardNumber, setCardNumber] = useState("");
  const [cardholder, setCardholder] = useState("ROBERT HUI");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const methods = availableMethods.filter((method) => method.id !== "paypal");
  const walletCoversPayable = walletBalance >= payable;
  const addablePaymentMethods = paymentMethods.filter((method) =>
    method.id === "card" && method.modes.includes(mode)
  );
  const paypalMethod = paymentMethods.find((method) => method.id === "paypal");

  function addMethod(methodId: PaymentMethodId) {
    if (methodId === "card") {
      setPage("add-card");
      return;
    }
    onAddPaymentMethod?.(methodId, undefined, makeDefault);
    onSelect(methodId);
  }

  function addCard() {
    const digits = cardNumber.replace(/\D/g, "");
    const cvvDigits = cvv.replace(/\D/g, "");
    if (digits.length < 12 || !cardholder.trim() || !isValidCardExpiry(expiry) || cvvDigits.length < 3) {
      return;
    }
    const brand: SavedPaymentCard["brand"] = digits.startsWith("5") ? "Mastercard" : "Visa";
    const newCard: SavedPaymentCard = {
      id: `card-${Date.now()}`,
      brand,
      last4: digits.slice(-4),
      cardholder: cardholder.trim().toUpperCase(),
      expiry: expiry.trim()
    };
    onAddPaymentMethod?.("card", newCard, makeDefault);
    onSelect("card");
  }

  if (page === "add-card") {
    const cardDigits = cardNumber.replace(/\D/g, "");
    const canSave = cardDigits.length >= 12 && Boolean(cardholder.trim()) && isValidCardExpiry(expiry) && cvv.replace(/\D/g, "").length >= 3;
    return (
      <Screen title="Add Card" eyebrow="Payment method" scrollKey={`payment-add-card-${mode}`} onBack={() => setPage("add-method")}>
        <Text style={styles.pageIntro}>Add a card for app payments and future orders.</Text>
        <Text style={styles.fieldLabel}>Card number</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={(value) => setCardNumber(formatCardNumberInput(value))}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={23}
        />
        <Text style={styles.fieldLabel}>Cardholder name</Text>
        <TextInput
          style={styles.input}
          value={cardholder}
          onChangeText={setCardholder}
          placeholder="Name on card"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
        />
        <View style={styles.cardFieldRow}>
          <View style={styles.cardField}>
            <Text style={styles.fieldLabel}>Exp. Date</Text>
            <TextInput
              style={styles.input}
              value={expiry}
              onChangeText={(value) => setExpiry(formatCardExpiryInput(value, expiry))}
              placeholder="MM/YY"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          <View style={styles.cardField}>
            <Text style={styles.fieldLabel}>CVV</Text>
            <TextInput
              style={styles.input}
              value={cvv}
              onChangeText={(value) => setCvv(value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
        <View style={styles.cardHintRow}>
          <Ionicons name={canSave ? "checkmark-circle" : "information-circle-outline"} size={16} color={canSave ? colors.success : colors.warning} />
          <Text style={styles.cardHintText}>{canSave ? "Card details are ready to add." : "Complete card number, name, exp. date, and CVV."}</Text>
        </View>
        <DefaultPaymentCheckbox
          selected={makeDefault}
          onPress={() => setMakeDefault((value) => !value)}
        />
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={!canSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={addCard}
        >
          <Text style={styles.saveButtonText}>Add Card</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  if (page === "add-method") {
    return (
      <Screen title="Add Payment Method" eyebrow="Payment method" scrollKey={`payment-add-method-${mode}`} onBack={() => setPage("list")}>
        <Text style={styles.pageIntro}>Add a payment method for app payments and future orders.</Text>
        <View style={styles.methodList}>
          {addablePaymentMethods.map((method) => (
            <OptionListItem
              key={method.id}
              variant="navigate"
              leading={{
                type: "icon",
                icon: method.icon,
                tone: method.id === "card" ? "neutral" : "success",
                color: method.id === "card" ? colors.ink : colors.onDark,
                backgroundColor: method.id === "card" ? undefined : colors.success
              }}
              title={method.title}
              text={method.id === "card" ? "Add another saved card" : method.subtitle}
              onPress={() => addMethod(method.id)}
            />
          ))}
          {paypalMethod ? (
            <OptionListItem
              variant="navigate"
              disabled
              leading={{
                type: "icon",
                icon: paypalMethod.icon,
                tone: "neutral",
                color: colors.muted
              }}
              title={paypalMethod.title}
              text="Coming soon"
            />
          ) : null}
          {addablePaymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={25} color={colors.success} />
              <Text style={styles.emptyTitle}>All supported methods added</Text>
              <Text style={styles.emptyText}>You can choose from the payment methods already listed.</Text>
            </View>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Choose Payment Method"
      eyebrow={
        mode === "topup"
          ? "Add Funds payment"
          : mode === "gift"
            ? "Gift payment"
            : "Checkout payment"
      }
      scrollKey={`payment-method-selection-${mode}`}
      onBack={onBack}
    >
      <InlineNotice
        icon="wallet-outline"
        title="Save More with Wallet eCard"
        meta="Up to 15% Bonus"
        text="Add funds to receive Bonus, then pay with your Wallet eCard balance. Bonus Balance is app credit and cannot be withdrawn as cash."
        tone="success"
      />

      <View style={styles.methodList}>
        {methods.map((method) => {
          const isSelected = selectedPayment === method.id;
          const isWallet = method.id === "wallet";
          const supportsMode = method.modes.includes(mode);
          const isDisabled = !supportsMode || (isWallet && !walletCoversPayable);

          const subtitle = !supportsMode
            ? "Not available for Add Funds"
            : isWallet
              ? `Available balance $${walletBalance.toFixed(2)}${walletCoversPayable ? "" : " · Add Funds needed"}`
              : method.subtitle;

          return (
            <OptionListItem
              key={method.id}
              variant="select"
              selected={isSelected}
              disabled={isDisabled}
              leading={{
                type: "icon",
                icon: method.icon,
                tone: isWallet ? "success" : "neutral",
                color: isWallet ? colors.onDark : colors.ink,
                backgroundColor: isWallet ? colors.success : undefined
              }}
              title={method.title}
              text={subtitle}
              style={isWallet ? styles.walletPaymentOption : undefined}
              onPress={() => {
                onSelect(method.id);
              }}
            />
          );
        })}
      </View>
      {onAddPaymentMethod ? (
        <View style={styles.addSection}>
          <OptionListItem
            variant="navigate"
            leading={{ type: "icon", icon: "add-circle-outline", tone: "neutral", color: colors.ink }}
            title="Add Payment Method"
            text="Credit / debit card or PayPal"
            onPress={() => setPage("add-method")}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function DefaultPaymentCheckbox({
  selected,
  onPress
}: {
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={styles.defaultToggle}
      onPress={onPress}
    >
      <View style={[styles.defaultCheckbox, selected && styles.defaultCheckboxSelected]}>
        {selected ? <Ionicons name="checkmark" size={14} color={colors.onDark} /> : null}
      </View>
      <Text style={styles.defaultToggleTitle}>Set as default payment method</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  methodList: {
    marginTop: spacing.lg,
    gap: 10
  },
  walletPaymentOption: {
    backgroundColor: statusColors.success.background,
    borderColor: statusColors.success.border
  },
  addSection: {
    marginTop: spacing.lg
  },
  pageIntro: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
    marginBottom: spacing.lg
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    marginBottom: 7
  },
  input: {
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: spacing.md
  },
  cardFieldRow: {
    flexDirection: "row",
    gap: 10
  },
  cardField: {
    flex: 1
  },
  cardHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
    marginBottom: spacing.lg
  },
  cardHintText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: -2,
    marginBottom: spacing.lg
  },
  defaultCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.canvas
  },
  defaultCheckboxSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  defaultToggleTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500"
  },
  saveButton: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  saveButtonDisabled: {
    opacity: 0.45
  },
  saveButtonText: {
    color: colors.onDark,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700"
  },
  emptyState: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 8
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 4
  }
});
