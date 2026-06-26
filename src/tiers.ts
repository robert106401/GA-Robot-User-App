export type TierName = "Green" | "Gold" | "Platinum" | "Diamond";

export type Tier = {
  code: "L0" | "L1" | "L2" | "L3";
  name: TierName;
  minExp: number;
  maxExp: number | null;
  pointsPerDollar: number;
  tagline: string;
  memberPriceEligible: boolean;
  benefits: string[];
};

export const tiers: Tier[] = [
  {
    code: "L0",
    name: "Green",
    minExp: 0,
    maxExp: 999,
    pointsPerDollar: 8,
    tagline: "Save More Every Day",
    memberPriceEligible: false,
    benefits: ["Earn 8 Points per $1 in app", "Save favorite drinks", "Wallet rewards"]
  },
  {
    code: "L1",
    name: "Gold",
    minExp: 1000,
    maxExp: 4999,
    pointsPerDollar: 11,
    tagline: "Unlock Extra Rewards",
    memberPriceEligible: true,
    benefits: ["Earn 11 Points per $1 in app", "Member price access", "Wallet rewards"]
  },
  {
    code: "L2",
    name: "Platinum",
    minExp: 5000,
    maxExp: 14999,
    pointsPerDollar: 13,
    tagline: "Your Everyday VIP",
    memberPriceEligible: true,
    benefits: ["Earn 13 Points per $1 in app", "Platinum offer priority", "Wallet rewards"]
  },
  {
    code: "L3",
    name: "Diamond",
    minExp: 15000,
    maxExp: null,
    pointsPerDollar: 17,
    tagline: "Maximum Value, Maximum Perks",
    memberPriceEligible: true,
    benefits: ["Earn 17 Points per $1 in app", "Diamond-only campaigns", "Wallet rewards"]
  }
];

export function getTierByExp(exp: number) {
  return tiers.find((tier) => exp >= tier.minExp && (tier.maxExp === null || exp <= tier.maxExp)) ?? tiers[0];
}

export function getNextTier(exp: number) {
  return tiers.find((tier) => tier.minExp > exp) ?? null;
}

export function getTierProgress(exp: number) {
  const currentTier = getTierByExp(exp);
  const nextTier = getNextTier(exp);

  if (!nextTier || currentTier.maxExp === null) {
    return {
      currentTier,
      nextTier,
      expToNextTier: 0,
      progress: 1
    };
  }

  const tierRange = nextTier.minExp - currentTier.minExp;
  const expInTier = Math.max(0, exp - currentTier.minExp);

  return {
    currentTier,
    nextTier,
    expToNextTier: Math.max(0, nextTier.minExp - exp),
    progress: Math.min(1, expInTier / tierRange)
  };
}
