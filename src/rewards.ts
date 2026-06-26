export const addFundsOffers = [
  { amount: 10, rewardsBonus: 1, rewardRate: "10%" },
  { amount: 30, rewardsBonus: 4, rewardRate: "13.3%" },
  { amount: 50, rewardsBonus: 7, rewardRate: "14%" },
  { amount: 100, rewardsBonus: 15, rewardRate: "15%" }
] as const;

export function calculatePurchasePoints(amount: number, pointsPerDollar: number) {
  return Math.floor(Math.max(0, amount) * pointsPerDollar);
}
