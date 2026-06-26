import { Ionicons } from "@expo/vector-icons";
import { colors } from "./theme";

export type ProductLabelGroup = "popular" | "healthy" | "combo";

export type ProductLabelKey =
  | "popular"
  | "light"
  | "protein"
  | "oat"
  | "hydrate"
  | "new"
  | "combo"
  | "share"
  | "breakfast";

export type ProductLabelMeta = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  groups: ProductLabelGroup[];
  priority: number;
};

export const productLabelMeta: Record<ProductLabelKey, ProductLabelMeta> = {
  popular: {
    label: "Popular",
    icon: "flame-outline",
    color: colors.warning,
    tint: "#F7E7D0",
    groups: ["popular"],
    priority: 100
  },
  light: {
    label: "Light",
    icon: "leaf-outline",
    color: colors.success,
    tint: "#E3F0E7",
    groups: ["healthy"],
    priority: 90
  },
  protein: {
    label: "Protein",
    icon: "fitness-outline",
    color: colors.blue,
    tint: "#E2EEF4",
    groups: ["healthy"],
    priority: 86
  },
  oat: {
    label: "Oat",
    icon: "nutrition-outline",
    color: colors.matcha,
    tint: "#E5EEDC",
    groups: ["healthy"],
    priority: 82
  },
  hydrate: {
    label: "Hydrate",
    icon: "water-outline",
    color: colors.blue,
    tint: "#E2EEF4",
    groups: ["healthy"],
    priority: 78
  },
  new: {
    label: "New",
    icon: "sparkles-outline",
    color: colors.berry,
    tint: "#F3E1E4",
    groups: [],
    priority: 70
  },
  combo: {
    label: "Combo",
    icon: "albums-outline",
    color: colors.coffee,
    tint: colors.tint,
    groups: ["combo"],
    priority: 65
  },
  share: {
    label: "Share",
    icon: "people-outline",
    color: colors.blue,
    tint: "#E2EEF4",
    groups: [],
    priority: 55
  },
  breakfast: {
    label: "AM",
    icon: "sunny-outline",
    color: colors.warning,
    tint: "#F7E7D0",
    groups: [],
    priority: 50
  }
};

export function getSortedProductLabels(labels: ProductLabelKey[]) {
  return [...labels].sort((a, b) => productLabelMeta[b].priority - productLabelMeta[a].priority);
}

export function hasProductLabelGroup(labels: ProductLabelKey[], group: ProductLabelGroup) {
  return labels.some((label) => productLabelMeta[label].groups.includes(group));
}
