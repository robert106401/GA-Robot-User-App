import { statusColors } from "./theme";
import type { OrderRecord } from "./types";
import { PREPAID_COLLECTION_WINDOW_MS } from "./state/appState";

export { PREPAID_COLLECTION_WINDOW_MS };
export const PREPAID_EXPIRY_NOTICE =
  "Collect within 24 hours. After expiry, the order amount moves to Bonus Balance and is not refunded to the original payment method.";

export type OrderTone = {
  text: string;
  backgroundColor: string;
  borderColor: string;
};

export function getOrderStatusTone(status: OrderRecord["status"]): OrderTone {
  if (status === "Ready to collect" || status === "Completed") {
    return tone(statusColors.success);
  }
  if (status === "Validating VM") {
    return tone(statusColors.info);
  }
  if (status === "Dispensing" || status === "Refunding" || status === "Awaiting payment") {
    return tone(statusColors.warning);
  }
  if (status === "Dispense failed" || status === "Expired") {
    return tone(statusColors.danger);
  }
  return tone(statusColors.neutral);
}

export function getExpiryTone(expiresAt: number | undefined, now = Date.now()): OrderTone {
  if (!expiresAt) {
    return tone(statusColors.neutral);
  }

  const remaining = expiresAt - now;
  if (remaining <= 30 * 60 * 1000) {
    return tone(statusColors.danger);
  }
  if (remaining <= 2 * 60 * 60 * 1000) {
    return tone(statusColors.warning);
  }
  return tone(statusColors.success);
}

export function formatOrderExpiry(expiresAt: number | undefined) {
  if (!expiresAt) {
    return "Expiry unavailable";
  }
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(expiresAt));
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(expiresAt));
  return `Expires ${date} at ${time}`;
}

export function formatOrderCountdown(
  expiresAt: number | undefined,
  now = Date.now(),
  compact = false
) {
  if (!expiresAt) {
    return compact ? "Ready" : "Valid for pickup";
  }

  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
  if (remainingSeconds === 0) {
    return "Expired";
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const underOneDay = remainingSeconds < 24 * 60 * 60;

  if (compact) {
    if (underOneDay) {
      return hours > 0
        ? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
        : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return hours > 0
      ? `${hours}h ${String(minutes).padStart(2, "0")}m`
      : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  if (underOneDay) {
    return hours > 0
      ? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s remaining`
      : `${minutes}m ${String(seconds).padStart(2, "0")}s remaining`;
  }
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m remaining`
    : `${minutes}m ${String(seconds).padStart(2, "0")}s remaining`;
}

function tone(tokens: {
  text: string;
  background: string;
  border: string;
}): OrderTone {
  return {
    text: tokens.text,
    backgroundColor: tokens.background,
    borderColor: tokens.border
  };
}
