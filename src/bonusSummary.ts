import { WalletBalances, WalletHistoryRecord } from "./types";

export type BonusSummary = {
  earned: number;
  used: number;
  available: number;
};

export function calculateBonusSummary(
  walletHistory: WalletHistoryRecord[],
  walletBalances: WalletBalances
): BonusSummary {
  const earned = walletHistory
    .filter((record) => record.account === "Rewards Bonus" && record.amount > 0)
    .reduce((sum, record) => sum + record.amount, 0);
  const used = walletHistory
    .filter((record) => record.account === "Rewards Bonus" && record.amount < 0)
    .reduce((sum, record) => sum + Math.abs(record.amount), 0);

  return {
    earned: roundMoney(earned || walletBalances.rewardsBonus + used),
    used: roundMoney(used),
    available: roundMoney(walletBalances.rewardsBonus)
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
