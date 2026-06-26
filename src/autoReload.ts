export type AutoReloadSettings = {
  enabled: boolean;
  threshold: number;
  amount: number;
};

export const defaultAutoReloadSettings: AutoReloadSettings = {
  enabled: false,
  threshold: 10,
  amount: 30
};

export const autoReloadThresholds = [5, 10, 15];
export const autoReloadAmounts = [10, 30, 50, 100];
