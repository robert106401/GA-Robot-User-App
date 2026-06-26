export type SkuCustomizationSelection = Record<string, string>;

export type WalletBalances = {
  cash: number;
  rewardsBonus: number;
};

export type XpRecord = {
  id: string;
  eventKey: string;
  title: string;
  description: string;
  date: string;
  amount: number;
  type: "Purchase" | "Wallet" | "Activity" | "Referral" | "Gift";
};

export type WalletHistoryRecord = {
  id: string;
  transactionId?: string;
  title: string;
  description: string;
  date: string;
  amount: number;
  balanceAfter: number;
  type: "Top Up" | "Rewards Bonus" | "Payment" | "Refund";
  account?: "Cash" | "Rewards Bonus";
  relatedOrderNumber?: string;
  originalPaymentMethod?: string;
  originalPaidAmount?: number;
  originalPaidAt?: string;
  expiredAt?: string;
  creditedTo?: "Bonus Balance" | "Cash Balance" | "Wallet eCard";
};

export type PaymentHistoryRecord = {
  id: string;
  transactionId?: string;
  title: string;
  description: string;
  date: string;
  amount: number;
  paidAmount?: number;
  rewardsBonusAmount?: number;
  method: "Wallet eCard" | "Apple Pay" | "Google Pay" | "PayPal" | "Credit Card";
  status: "Paid" | "Completed" | "Refunded" | "Pending" | "Failed";
  points: number;
  type: "Order" | "Top Up" | "Refund" | "Gift" | "Partner Offer";
};

export type TopUpResult = {
  amount: number;
  rewardsBonus: number;
  paymentMethodId: "card" | "apple-pay" | "google-pay" | "paypal";
};

export type CartItem = {
  skuId: string;
  quantity: number;
  customizationSummary: string;
};

export type BenefitApplied = {
  id: string;
  type: "Voucher" | "Coupon" | "Points" | "Member Benefit";
  title: string;
  valueApplied: number;
  pointsCost?: number;
};

export type OrderLineItem = {
  skuId: string;
  name: string;
  quantity: number;
  customizationSummary: string;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  title: string;
  date: string;
  amount: string;
  orderMode: "vm_app_pay" | "app_preorder";
  status:
    | "Awaiting payment"
    | "Paid"
    | "Ready to collect"
    | "Validating VM"
    | "Dispensing"
    | "Completed"
    | "Dispense failed"
    | "Expired"
    | "Cancelled"
    | "Refunding"
    | "Refunded";
  itemCount: number;
  paymentMethod: string;
  points: number;
  items: OrderLineItem[];
  machineId?: string;
  machineName?: string;
  pickupCode?: string;
  pickupExpiresAt?: string;
  pickupExpiresAtEpoch?: number;
  redemptionToken?: string;
  redemptionMethod?: "vm_code" | "app_scan";
};

export type CheckoutResult = {
  title: string;
  amount: number;
  itemCount: number;
  paymentMethod: string;
  paymentMethodId: "wallet" | "card" | "apple-pay" | "google-pay" | "paypal";
  points: number;
  benefitsApplied?: BenefitApplied[];
  pointsRedeemed?: number;
  items: CartItem[];
};

export type GiftKind = "voucher" | "ecard";

export type FriendRecord = {
  id: string;
  name: string;
  phone: string;
  gender: string;
  relationship: string;
  note?: string;
};

export type GiftRecord = {
  id: string;
  giftCode: string;
  kind: GiftKind;
  title: string;
  recipientName: string;
  recipientContact: string;
  message: string;
  occasion: string;
  amount: number;
  status: "Sent" | "Claimed" | "Expired";
  date: string;
  expiresAt: string;
  claimedAt?: string;
  skuId?: string;
  redemptionScope?: string;
  validDays?: number;
};

export type PartnerOfferPurchaseRecord = {
  offerId: string;
  code: string;
  purchasedAt: string;
};

export type RedeemedPointReward = {
  id: string;
  code: string;
  title: string;
  description: string;
  rewardType: "Coupon" | "Voucher";
  pointsCost: number;
  status: "Active" | "Used" | "Expired";
  date: string;
  expiresAt: string;
  usedAt?: string;
};

export type UsedBenefitRecord = {
  key: string;
  usedAt: string;
};

export type GiftPurchaseResult = {
  kind: GiftKind;
  title: string;
  recipientName: string;
  recipientContact: string;
  message: string;
  occasion: string;
  amount: number;
  payableAmount?: number;
  paymentMethod: string;
  paymentMethodId: "wallet" | "card" | "apple-pay" | "google-pay" | "paypal";
  benefitsApplied?: BenefitApplied[];
  pointsRedeemed?: number;
  skuId?: string;
  redemptionScope?: string;
  validDays?: number;
};
