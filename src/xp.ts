export const XP_RULES = {
  purchasePerDollar: 10,
  addFundsPerDollar: 2,
  dailyCheckIn: 5,
  sevenDayStreak: 50,
  review: 20,
  photoReview: 30,
  nearbyDeals: 20,
  campaign: 50,
  inviteRegistration: 100,
  inviteFirstOrder: 200,
  sendGift: 50
} as const;

export type XpAction =
  | "daily-check-in"
  | "review"
  | "photo-review"
  | "nearby-deals"
  | "campaign"
  | "invite-registration"
  | "invite-first-order";

export function calculatePurchaseXp(amount: number) {
  return Math.round(amount * XP_RULES.purchasePerDollar);
}

export function calculateAddFundsXp(amount: number) {
  return Math.round(amount * XP_RULES.addFundsPerDollar);
}
