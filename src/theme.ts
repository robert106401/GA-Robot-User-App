import type { TextStyle } from "react-native";

export const palette = {
  cream50: "#FFFDF8",
  cream100: "#F7F3EA",
  cream200: "#EFE4CE",
  cream300: "#E1D9C9",
  cream400: "#D8C7A7",
  neutral500: "#747067",
  neutral700: "#704C35",
  neutral900: "#22211D",
  white: "#FFFFFF",
  black: "#000000",
  green50: "#F3FAF5",
  green100: "#EAF6EF",
  green200: "#B9DAC7",
  green600: "#39745B",
  amber50: "#FFF8EA",
  amber100: "#FFF3D8",
  amber200: "#EFD8A7",
  amber600: "#9A6724",
  red50: "#F7E8EA",
  red100: "#F8E9EA",
  red200: "#E8C7CB",
  red600: "#B85662",
  blue50: "#F7FBFD",
  blue100: "#E7F0F6",
  blue200: "#AFC8D8",
  blue600: "#3D6F8F",
  gold500: "#D7A64D",
  matcha500: "#6A8C55"
} as const;

export const semanticPalette = {
  success: "#14854A",
  successBg: "#EAF7EF",
  successSubtleBg: "#D7F0E1",
  successBorder: "#9ED7B4",
  warning: "#A86500",
  warningBg: "#FFF7E6",
  warningSubtleBg: "#FFEBC2",
  warningBorder: "#E7C16C",
  danger: "#C93E4F",
  dangerBg: "#FFF0F2",
  dangerSubtleBg: "#FFE0E5",
  dangerBorder: "#EDA8B3",
  info: "#2E71B8",
  infoBg: "#EEF6FF",
  infoSubtleBg: "#DDEEFF",
  infoBorder: "#A9C9EC",
  neutralBg: "#ECEBE7",
  reward: "#A76C1B",
  rewardBg: "#FFF5DE",
  rewardBorder: "#E4C176",
  exp: "#5F4BB6",
  expBg: "#F1EEFF",
  expBorder: "#C8BDF3",
  points: "#196FA6",
  pointsBg: "#EAF6FF",
  pointsBorder: "#A9D0EA",
  voucher: "#B04D7C",
  voucherBg: "#FFF0F7",
  voucherBorder: "#E9A9C8",
  coupon: "#8A6A19",
  couponBg: "#FFF8DC",
  couponBorder: "#DCCB77"
} as const;

export type AppThemeId = "classic" | "vibrant" | "urbanPulse" | "cupertino" | "vividNature";

type CampaignColorToken = {
  background: string;
  accent: string;
  iconBackground: string;
};

type HomeColorTokens = {
  campaignCards: [CampaignColorToken, CampaignColorToken, CampaignColorToken];
  quickActionBackground: string;
  prepaidBackground: string;
  prepaidSubtleBackground: string;
  prepaidBorder: string;
  partnerValue: string;
};

type ColorTokens = {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  tint: string;
  coffee: string;
  milk: string;
  matcha: string;
  berry: string;
  blue: string;
  success: string;
  warning: string;
  onDark: string;
  scrim: string;
  home: HomeColorTokens;
};

type StatusColorTokens = {
  success: {
    text: string;
    background: string;
    subtleBackground: string;
    border: string;
  };
  warning: {
    text: string;
    background: string;
    subtleBackground: string;
    border: string;
  };
  danger: {
    text: string;
    background: string;
    subtleBackground: string;
    border: string;
  };
  info: {
    text: string;
    background: string;
    subtleBackground: string;
    border: string;
  };
  neutral: {
    text: string;
    background: string;
    border: string;
  };
};

type AssetColorTokens = {
  exp: StatusColorTokens["success"];
  points: StatusColorTokens["success"];
  rewardBonus: StatusColorTokens["success"];
  voucher: StatusColorTokens["success"];
  coupon: StatusColorTokens["success"];
};

type AppTheme = {
  id: AppThemeId;
  label: string;
  description: string;
  colors: ColorTokens;
  statusColors: StatusColorTokens;
};

const classicColors: ColorTokens = {
  canvas: palette.cream100,
  surface: palette.cream50,
  ink: palette.neutral900,
  muted: palette.neutral500,
  line: palette.cream300,
  tint: palette.cream200,
  coffee: palette.neutral700,
  milk: palette.gold500,
  matcha: palette.matcha500,
  berry: palette.red600,
  blue: palette.blue600,
  success: semanticPalette.success,
  warning: semanticPalette.warning,
  onDark: palette.white,
  scrim: palette.black,
  home: {
    campaignCards: [
      { background: "#F1E5D0", accent: "#704C35", iconBackground: "#E6D0AB" },
      { background: "#F7E7E1", accent: "#A94E55", iconBackground: "#EECFC6" },
      { background: "#E5ECDC", accent: "#39745B", iconBackground: "#CCDAB8" }
    ],
    quickActionBackground: palette.cream50,
    prepaidBackground: "#F4F8FA",
    prepaidSubtleBackground: "#E7F0F6",
    prepaidBorder: "#C7D8E2",
    partnerValue: "#8A6A19"
  }
} as const;

const classicStatusColors: StatusColorTokens = {
  success: {
    text: palette.green600,
    background: palette.green50,
    subtleBackground: palette.green100,
    border: palette.green200
  },
  warning: {
    text: palette.amber600,
    background: palette.amber50,
    subtleBackground: palette.amber100,
    border: palette.amber200
  },
  danger: {
    text: palette.red600,
    background: palette.red50,
    subtleBackground: palette.red100,
    border: palette.red200
  },
  info: {
    text: palette.blue600,
    background: palette.blue50,
    subtleBackground: palette.blue100,
    border: palette.blue200
  },
  neutral: {
    text: palette.neutral500,
    background: "#ECEBE7",
    border: palette.cream300
  }
} as const;

const vibrantColors: ColorTokens = {
  canvas: "#FFF8F2",
  surface: "#FFFFFF",
  ink: "#292542",
  muted: "#706A82",
  line: "#DDD5E8",
  tint: "#FFE1D4",
  coffee: "#7A4F9A",
  milk: "#F3B83F",
  matcha: "#36A77E",
  berry: "#EC5F72",
  blue: "#397FD5",
  success: semanticPalette.success,
  warning: semanticPalette.warning,
  onDark: palette.white,
  scrim: palette.black,
  home: {
    campaignCards: [
      { background: "#FFEADF", accent: "#C94F28", iconBackground: "#FFD4C0" },
      { background: "#FFE7EF", accent: "#C83F58", iconBackground: "#FFC9D8" },
      { background: "#E4F7EF", accent: "#238C69", iconBackground: "#C9ECDE" }
    ],
    quickActionBackground: "#FFFFFF",
    prepaidBackground: "#F2F7FF",
    prepaidSubtleBackground: "#E5EFFF",
    prepaidBorder: "#BCD2EF",
    partnerValue: "#C94F28"
  }
} as const;

const vibrantStatusColors: StatusColorTokens = {
  success: {
    text: "#238C69",
    background: "#EAF9F3",
    subtleBackground: "#D4F2E6",
    border: "#9DDCC5"
  },
  warning: {
    text: "#B36B00",
    background: "#FFF8DF",
    subtleBackground: "#FFF0B8",
    border: "#E8CA68"
  },
  danger: {
    text: "#C83F58",
    background: "#FFF0F3",
    subtleBackground: "#FFDDE4",
    border: "#F0A8B6"
  },
  info: {
    text: "#397FD5",
    background: "#EEF6FF",
    subtleBackground: "#DDEBFF",
    border: "#A9C8EF"
  },
  neutral: {
    text: "#706A82",
    background: "#F2EEF7",
    border: "#DDD5E8"
  }
} as const;

const urbanPulseColors: ColorTokens = {
  canvas: "#E9ECEB",
  surface: "#FAFCFB",
  ink: "#171B1A",
  muted: "#626A67",
  line: "#C5CBC8",
  tint: "#D5DBD8",
  coffee: "#313836",
  milk: "#C4E538",
  matcha: "#71951B",
  berry: "#D64B72",
  blue: "#2878D0",
  success: semanticPalette.success,
  warning: semanticPalette.warning,
  onDark: palette.white,
  scrim: palette.black,
  home: {
    campaignCards: [
      { background: "#EEF1EF", accent: "#313836", iconBackground: "#D9E1DD" },
      { background: "#F4E7ED", accent: "#A83B58", iconBackground: "#E8CED9" },
      { background: "#EEF4DA", accent: "#527C16", iconBackground: "#D8E7AD" }
    ],
    quickActionBackground: "#FAFCFB",
    prepaidBackground: "#F1F5F6",
    prepaidSubtleBackground: "#E2EAEE",
    prepaidBorder: "#B8C7CD",
    partnerValue: "#527C16"
  }
} as const;

const urbanPulseStatusColors: StatusColorTokens = {
  success: {
    text: "#527C16",
    background: "#F2F8DB",
    subtleBackground: "#E6F0BD",
    border: "#C6D889"
  },
  warning: {
    text: "#987000",
    background: "#FFF8D8",
    subtleBackground: "#F7ECB5",
    border: "#DCCB79"
  },
  danger: {
    text: "#B7355C",
    background: "#FFF0F4",
    subtleBackground: "#F7DAE3",
    border: "#DFA9BA"
  },
  info: {
    text: "#2878D0",
    background: "#EDF5FF",
    subtleBackground: "#DCEAFF",
    border: "#A8C7EC"
  },
  neutral: {
    text: "#626A67",
    background: "#E0E5E3",
    border: "#C5CBC8"
  }
} as const;

const cupertinoColors: ColorTokens = {
  canvas: "#F2F2F7",
  surface: "#FFFFFF",
  ink: "#1C1C1E",
  muted: "#6E6E73",
  line: "#D1D1D6",
  tint: "#E5E5EA",
  coffee: "#3A3A3C",
  milk: "#FF9F0A",
  matcha: "#34C759",
  berry: "#FF375F",
  blue: "#007AFF",
  success: semanticPalette.success,
  warning: semanticPalette.warning,
  onDark: palette.white,
  scrim: palette.black,
  home: {
    campaignCards: [
      { background: "#FFFFFF", accent: "#007AFF", iconBackground: "#EEF6FF" },
      { background: "#FFF4F6", accent: "#D70015", iconBackground: "#FFE6EA" },
      { background: "#F5FBF6", accent: "#248A3D", iconBackground: "#E7F5EA" }
    ],
    quickActionBackground: "#FFFFFF",
    prepaidBackground: "#F5F9FF",
    prepaidSubtleBackground: "#EAF4FF",
    prepaidBorder: "#BCD9F7",
    partnerValue: "#007AFF"
  }
} as const;

const cupertinoStatusColors: StatusColorTokens = {
  success: {
    text: "#248A3D",
    background: "#F0F9F2",
    subtleBackground: "#E1F4E5",
    border: "#A9DDB4"
  },
  warning: {
    text: "#A86400",
    background: "#FFF8E8",
    subtleBackground: "#FFF0CC",
    border: "#E9C778"
  },
  danger: {
    text: "#D70015",
    background: "#FFF0F1",
    subtleBackground: "#FFE0E3",
    border: "#F0ADB5"
  },
  info: {
    text: "#007AFF",
    background: "#EEF6FF",
    subtleBackground: "#DDEEFF",
    border: "#A8CFF5"
  },
  neutral: {
    text: "#6E6E73",
    background: "#E5E5EA",
    border: "#D1D1D6"
  }
} as const;

const vividNatureColors: ColorTokens = {
  canvas: "#F1FAEA",
  surface: "#FFFFFF",
  ink: "#183326",
  muted: "#5D7466",
  line: "#C9E4D1",
  tint: "#DDF6C9",
  coffee: "#2C7A43",
  milk: "#FFCF3F",
  matcha: "#18A957",
  berry: "#E5426D",
  blue: "#0A8FDC",
  success: semanticPalette.success,
  warning: semanticPalette.warning,
  onDark: palette.white,
  scrim: palette.black,
  home: {
    campaignCards: [
      { background: "#E7F6D8", accent: "#2C7A43", iconBackground: "#CBEAAE" },
      { background: "#FDE7EF", accent: "#B9315A", iconBackground: "#F7C7D8" },
      { background: "#E2F6FF", accent: "#0A78C8", iconBackground: "#C6E9FA" }
    ],
    quickActionBackground: "#FFFFFF",
    prepaidBackground: "#F0FAFF",
    prepaidSubtleBackground: "#DFF2FD",
    prepaidBorder: "#B1D9EF",
    partnerValue: "#0A78C8"
  }
} as const;

const vividNatureStatusColors: StatusColorTokens = {
  success: {
    text: "#16884A",
    background: "#E8FAEF",
    subtleBackground: "#D2F3DD",
    border: "#8ED8A6"
  },
  warning: {
    text: "#B97800",
    background: "#FFF8D9",
    subtleBackground: "#FFF0A8",
    border: "#E8C95F"
  },
  danger: {
    text: "#C72F5B",
    background: "#FFF0F5",
    subtleBackground: "#FFDCE8",
    border: "#F0A5B9"
  },
  info: {
    text: "#0A78C8",
    background: "#EAF7FF",
    subtleBackground: "#D6EEFF",
    border: "#9AD0F1"
  },
  neutral: {
    text: "#5D7466",
    background: "#E4F1E8",
    border: "#C9E4D1"
  }
} as const;

const stableStatusColors: StatusColorTokens = {
  success: {
    text: semanticPalette.success,
    background: semanticPalette.successBg,
    subtleBackground: semanticPalette.successSubtleBg,
    border: semanticPalette.successBorder
  },
  warning: {
    text: semanticPalette.warning,
    background: semanticPalette.warningBg,
    subtleBackground: semanticPalette.warningSubtleBg,
    border: semanticPalette.warningBorder
  },
  danger: {
    text: semanticPalette.danger,
    background: semanticPalette.dangerBg,
    subtleBackground: semanticPalette.dangerSubtleBg,
    border: semanticPalette.dangerBorder
  },
  info: {
    text: semanticPalette.info,
    background: semanticPalette.infoBg,
    subtleBackground: semanticPalette.infoSubtleBg,
    border: semanticPalette.infoBorder
  },
  neutral: {
    text: palette.neutral500,
    background: semanticPalette.neutralBg,
    border: palette.cream300
  }
} as const;

export const assetColors: AssetColorTokens = {
  exp: {
    text: semanticPalette.exp,
    background: semanticPalette.expBg,
    subtleBackground: semanticPalette.expBg,
    border: semanticPalette.expBorder
  },
  points: {
    text: semanticPalette.points,
    background: semanticPalette.pointsBg,
    subtleBackground: semanticPalette.pointsBg,
    border: semanticPalette.pointsBorder
  },
  rewardBonus: {
    text: semanticPalette.reward,
    background: semanticPalette.rewardBg,
    subtleBackground: semanticPalette.rewardBg,
    border: semanticPalette.rewardBorder
  },
  voucher: {
    text: semanticPalette.voucher,
    background: semanticPalette.voucherBg,
    subtleBackground: semanticPalette.voucherBg,
    border: semanticPalette.voucherBorder
  },
  coupon: {
    text: semanticPalette.coupon,
    background: semanticPalette.couponBg,
    subtleBackground: semanticPalette.couponBg,
    border: semanticPalette.couponBorder
  }
} as const;

export const themes: Record<AppThemeId, AppTheme> = {
  classic: {
    id: "classic",
    label: "Classic Cream",
    description: "Warm coffee-and-cream palette",
    colors: classicColors,
    statusColors: classicStatusColors
  },
  vibrant: {
    id: "vibrant",
    label: "Vibrant Energy",
    description: "Coral, sunshine, fresh teal, and bright blue",
    colors: vibrantColors,
    statusColors: vibrantStatusColors
  },
  urbanPulse: {
    id: "urbanPulse",
    label: "Urban Pulse",
    description: "Graphite, cool white, and electric lime",
    colors: urbanPulseColors,
    statusColors: urbanPulseStatusColors
  },
  cupertino: {
    id: "cupertino",
    label: "Cupertino Light",
    description: "Clean whites, system blue, and grouped grays",
    colors: cupertinoColors,
    statusColors: cupertinoStatusColors
  },
  vividNature: {
    id: "vividNature",
    label: "Vivid Nature",
    description: "Lush greens, sky blue, blossom berry, and sunlit gold",
    colors: vividNatureColors,
    statusColors: vividNatureStatusColors
  }
};

let activeThemeId: AppThemeId = "cupertino";

export const colors = { ...cupertinoColors };
export const statusColors = {
  success: { ...stableStatusColors.success },
  warning: { ...stableStatusColors.warning },
  danger: { ...stableStatusColors.danger },
  info: { ...stableStatusColors.info },
  neutral: { ...stableStatusColors.neutral }
};

export function isAppThemeId(value: unknown): value is AppThemeId {
  return (
    value === "classic" ||
    value === "vibrant" ||
    value === "urbanPulse" ||
    value === "cupertino" ||
    value === "vividNature"
  );
}

export function activateAppTheme(themeId: AppThemeId) {
  const theme = themes[themeId] ?? themes.cupertino;
  activeThemeId = theme.id;
  Object.assign(colors, theme.colors);
  colors.success = stableStatusColors.success.text;
  colors.warning = stableStatusColors.warning.text;
}

export function getActiveTheme() {
  return themes[activeThemeId];
}

export const themeOptions = [
  themes.cupertino,
  themes.urbanPulse,
  themes.vividNature,
  themes.vibrant,
  themes.classic
];

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 22,
  section: 24,
  pageBottom: 28,
  actionBottom: 32,
  screenX: 18,
  sectionY: 22
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  card: 8,
  pill: 999
} as const;

export const fontSizes = {
  caption: 11,
  meta: 11,
  bodySmall: 12,
  body: 13,
  label: 14,
  button: 15,
  bodyLarge: 16,
  sectionTitle: 18,
  value: 24,
  pageTitle: 28,
  display: 30
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  black: "800"
} as const;

export const typography = {
  pageTitle: {
    fontSize: fontSizes.pageTitle,
    lineHeight: 34,
    fontWeight: fontWeights.bold
  },
  sectionTitle: {
    fontSize: fontSizes.sectionTitle,
    lineHeight: 24,
    fontWeight: fontWeights.bold
  },
  body: {
    fontSize: fontSizes.body,
    lineHeight: 19,
    fontWeight: fontWeights.regular
  },
  bodySmall: {
    fontSize: fontSizes.bodySmall,
    lineHeight: 17,
    fontWeight: fontWeights.regular
  },
  label: {
    fontSize: fontSizes.label,
    lineHeight: 19,
    fontWeight: fontWeights.semibold
  },
  button: {
    fontSize: fontSizes.button,
    lineHeight: 20,
    fontWeight: fontWeights.semibold
  },
  value: {
    fontSize: fontSizes.value,
    lineHeight: 29,
    fontWeight: fontWeights.bold,
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"]
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: 15,
    fontWeight: fontWeights.semibold
  }
} as const;

export const controlSizes = {
  backButton: 42,
  iconButton: 42,
  primaryButton: 56,
  bottomActionBar: 82
} as const;
