import type { Ionicons } from "@expo/vector-icons";

export type PaymentMethodId = "wallet" | "card" | "apple-pay" | "google-pay" | "paypal";
export type PaymentMethodMode = "checkout" | "topup" | "gift";

export type PaymentMethod = {
  id: PaymentMethodId;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  modes: PaymentMethodMode[];
  recommended?: boolean;
};

export type SavedPaymentCard = {
  id: string;
  brand: "Visa" | "Mastercard";
  last4: string;
  cardholder: string;
  expiry: string;
};

type AvailablePaymentMethodConfig = {
  addedPaymentMethodIds: PaymentMethodId[];
  currentCardId: string;
  savedCards: SavedPaymentCard[];
  systemPaymentMethodIds: PaymentMethodId[];
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "wallet",
    title: "Wallet eCard",
    subtitle: "Stored app balance",
    icon: "wallet-outline",
    modes: ["checkout", "gift"],
    recommended: true
  },
  {
    id: "card",
    title: "Credit / debit card",
    subtitle: "Visa · •••• 4242",
    icon: "card-outline",
    modes: ["checkout", "topup", "gift"]
  },
  {
    id: "apple-pay",
    title: "Apple Pay",
    subtitle: "Fast payment on iPhone",
    icon: "logo-apple",
    modes: ["checkout", "topup", "gift"]
  },
  {
    id: "google-pay",
    title: "Google Pay",
    subtitle: "Available on Android devices",
    icon: "logo-google",
    modes: ["checkout", "topup", "gift"]
  },
  {
    id: "paypal",
    title: "PayPal",
    subtitle: "Pay securely with your PayPal account",
    icon: "logo-paypal",
    modes: ["checkout", "topup", "gift"]
  }
];

export function getPaymentMethod(id: PaymentMethodId) {
  return paymentMethods.find((method) => method.id === id) ?? paymentMethods[0];
}

export function getPaymentMethodsForMode(mode: PaymentMethodMode) {
  return paymentMethods.filter((method) => method.modes.includes(mode));
}

export function getAvailablePaymentMethods({
  addedPaymentMethodIds,
  currentCardId,
  savedCards,
  systemPaymentMethodIds
}: AvailablePaymentMethodConfig) {
  const currentCard = savedCards.find((card) => card.id === currentCardId) ?? savedCards[0];
  const availableIds = new Set<PaymentMethodId>(["wallet", ...addedPaymentMethodIds, ...systemPaymentMethodIds]);
  if (!currentCard) {
    availableIds.delete("card");
  }

  return paymentMethods
    .filter((method) => availableIds.has(method.id))
    .map((method) => {
      if (method.id !== "card" || !currentCard) {
        return method;
      }
      return {
        ...method,
        subtitle: `${currentCard.brand} · •••• ${currentCard.last4}`
      };
    });
}

export function getEligibleDefaultPaymentMethod(
  defaultMethod: PaymentMethodId,
  mode: PaymentMethodMode
): PaymentMethodId {
  const method = getPaymentMethod(defaultMethod);
  if (method.modes.includes(mode)) {
    return defaultMethod;
  }
  return mode === "topup" ? "card" : "wallet";
}
