import { Tier } from "./tiers";

export type TierVisual = {
  background: string;
  highlight: string;
  gloss: string;
  shadow: string;
  primaryText: string;
  accent: string;
  secondaryAccent: string;
  mutedText: string;
  subtleText: string;
  tileBackground: string;
  actionBackground: string;
  border: string;
};

const tierVisuals: Record<Tier["code"], TierVisual> = {
  L0: {
    background: "#1E5F48",
    highlight: "rgba(255,255,255,0.18)",
    gloss: "rgba(221,246,231,0.20)",
    shadow: "#123D2F",
    primaryText: "#FFFFFF",
    accent: "#C5EFD4",
    secondaryAccent: "#4E9677",
    mutedText: "#D6EADF",
    subtleText: "#B9D4C6",
    tileBackground: "rgba(255,255,255,0.13)",
    actionBackground: "rgba(255,255,255,0.18)",
    border: "#5A987D"
  },
  L1: {
    background: "#C18A27",
    highlight: "rgba(255,255,255,0.30)",
    gloss: "rgba(255,236,170,0.34)",
    shadow: "#725114",
    primaryText: "#FFFDF5",
    accent: "#FFE9A7",
    secondaryAccent: "#E0B75A",
    mutedText: "#F7EAC5",
    subtleText: "#E8D49D",
    tileBackground: "rgba(255,255,255,0.14)",
    actionBackground: "rgba(255,255,255,0.20)",
    border: "#D2A64D"
  },
  L2: {
    background: "#DEDDD7",
    highlight: "rgba(255,255,255,0.52)",
    gloss: "rgba(255,255,255,0.42)",
    shadow: "#9A978F",
    primaryText: "#2F2E2A",
    accent: "#766F62",
    secondaryAccent: "#BDB9AF",
    mutedText: "#5F5B52",
    subtleText: "#767166",
    tileBackground: "rgba(255,255,255,0.34)",
    actionBackground: "rgba(255,255,255,0.48)",
    border: "#B8B5AD"
  },
  L3: {
    background: "#171A20",
    highlight: "rgba(255,255,255,0.16)",
    gloss: "rgba(205,238,255,0.22)",
    shadow: "#07090D",
    primaryText: "#FFFFFF",
    accent: "#CDEEFF",
    secondaryAccent: "#50647A",
    mutedText: "#DDE8EF",
    subtleText: "#AFC2CE",
    tileBackground: "rgba(205,238,255,0.10)",
    actionBackground: "rgba(205,238,255,0.14)",
    border: "#536878"
  }
};

export function getTierVisual(tier: Tier) {
  return tierVisuals[tier.code];
}
