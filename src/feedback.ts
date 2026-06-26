import { Ionicons } from "@expo/vector-icons";

export type AppToastTone = "success" | "info" | "warning" | "error";

export type AppToastMessage = {
  tone: AppToastTone;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};
