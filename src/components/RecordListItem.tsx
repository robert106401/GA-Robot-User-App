import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  BaseListItem,
  ListLeadingConfig,
  ListTrailingConfig
} from "./ListItem";

type RecordListDensity = "regular" | "compact";

type RecordListItemProps = {
  leading: ListLeadingConfig;
  title: string;
  primary?: string;
  secondary?: string;
  datetime?: string;
  recordId?: string;
  source?: string;
  detail?: ReactNode;
  titleAccessory?: ReactNode;
  trailing?: ListTrailingConfig;
  lines?: 2 | 3;
  density?: RecordListDensity;
  last?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function RecordListItem({
  leading,
  title,
  primary,
  secondary,
  datetime,
  recordId,
  source,
  detail,
  titleAccessory,
  trailing,
  lines = 3,
  density = "regular",
  last = false,
  onPress,
  style
}: RecordListItemProps) {
  const standardMeta = [datetime, recordId].filter(Boolean).join(" · ");
  const secondaryText = [secondary, source].filter(Boolean).join(" · ");
  const alignedTrailing = trailing?.type === "countdown"
    ? { ...trailing, rowLines: lines }
    : trailing;

  return (
    <BaseListItem
      leading={leading}
      title={title}
      primary={secondaryText || primary}
      secondary={standardMeta}
      detail={detail}
      titleAccessory={titleAccessory}
      trailing={alignedTrailing}
      lines={lines}
      density={density}
      last={last}
      onPress={onPress}
      style={style}
    />
  );
}
