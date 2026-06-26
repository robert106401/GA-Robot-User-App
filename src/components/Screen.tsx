import { PropsWithChildren, ReactNode, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { NavigationBackButton } from "./NavigationBackButton";
import { colors, controlSizes, getActiveTheme, spacing, typography } from "../theme";

const savedScrollPositions = new Map<string, number>();

export function clearSavedScrollPosition(scrollKey: string) {
  savedScrollPositions.set(scrollKey, 0);
}

type ScreenProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  trailing?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  bottomAction?: ReactNode;
  initialScrollY?: number;
  onScrollYChange?: (offsetY: number) => void;
  scrollKey?: string;
  fixedHeader?: boolean;
}>;

export function Screen({
  title,
  eyebrow,
  trailing,
  onBack,
  backLabel = "Back",
  bottomAction,
  initialScrollY = 0,
  onScrollYChange,
  scrollKey,
  fixedHeader = false,
  children
}: ScreenProps) {
  const theme = getActiveTheme();
  const scrollRef = useRef<ScrollView>(null);
  const restoredKeyRef = useRef<string | null>(null);
  const restoredScrollY = scrollKey
    ? savedScrollPositions.get(scrollKey) ?? initialScrollY
    : initialScrollY;

  useEffect(() => {
    if (!scrollKey) {
      return;
    }

    restoredKeyRef.current = null;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: savedScrollPositions.get(scrollKey) ?? initialScrollY,
        animated: false
      });
      restoredKeyRef.current = scrollKey;
    });

    return () => cancelAnimationFrame(frame);
  }, [initialScrollY, scrollKey]);

  function restoreAfterLayout() {
    if (!scrollKey || restoredKeyRef.current === scrollKey) {
      return;
    }
    scrollRef.current?.scrollTo({ y: restoredScrollY, animated: false });
    restoredKeyRef.current = scrollKey;
  }

  const initialContentOffset = scrollKey && restoredKeyRef.current === scrollKey
    ? undefined
    : { x: 0, y: restoredScrollY };

  const headerContent = (
    <View style={styles.header}>
      <View style={styles.heading}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: theme.colors.muted }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: theme.colors.ink }]}>{title}</Text>
      </View>
      <View style={styles.headerActions}>
        {typeof trailing === "string" ? (
          <Text style={[styles.trailing, { color: theme.colors.coffee }]}>{trailing}</Text>
        ) : trailing}
        {onBack ? <NavigationBackButton label={backLabel} onPress={onBack} placement="header" /> : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.canvas }]}>
      {fixedHeader ? <View style={styles.fixedHeader}>{headerContent}</View> : null}
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, Boolean(bottomAction) && styles.contentWithBottomAction]}
          contentOffset={initialContentOffset}
          onContentSizeChange={restoreAfterLayout}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            if (scrollKey) {
              savedScrollPositions.set(scrollKey, offsetY);
            }
            onScrollYChange?.(offsetY);
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {fixedHeader ? null : headerContent}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {bottomAction}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  keyboardAvoider: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
    paddingBottom: spacing.pageBottom
  },
  contentWithBottomAction: {
    paddingBottom: controlSizes.bottomActionBar + spacing.actionBottom
  },
  fixedHeader: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.canvas
  },
  header: {
    minHeight: controlSizes.bottomActionBar - spacing.sm - spacing.xxs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  heading: {
    flex: 1,
    paddingRight: spacing.md
  },
  headerActions: {
    maxWidth: "52%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm
  },
  eyebrow: {
    color: colors.muted,
    ...typography.body,
    marginBottom: spacing.xs
  },
  title: {
    color: colors.ink,
    ...typography.pageTitle
  },
  trailing: {
    color: colors.coffee,
    ...typography.body
  }
});
