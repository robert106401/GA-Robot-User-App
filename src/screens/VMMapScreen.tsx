import { useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  Linking,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { BaseListItem } from "../components/ListItem";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { vendingMachines } from "../data/appData";
import { colors } from "../theme";
import { robotVisualAsset } from "../visualAssets";

type VMMapScreenProps = {
  onOpenVM: (vmId: string) => void;
};

const MAP_WIDTH = 340;
const MAP_HEIGHT = 280;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 2.1;

const mapPositions: Record<string, { x: number; y: number; label: string }> = {
  "vm-1": { x: 54, y: 62, label: "018" },
  "vm-2": { x: 220, y: 132, label: "021" },
  "vm-3": { x: 126, y: 206, label: "034" }
};

export function VMMapScreen({ onOpenVM }: VMMapScreenProps) {
  const [zoom, setZoom] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const gestureStart = useRef({ x: 0, y: 0, zoom: 1, distance: 0 });

  const transformedVMs = useMemo(
    () =>
      vendingMachines.map((vm) => {
        const position = mapPositions[vm.id];
        return {
          ...vm,
          mapLabel: position.label,
          mapLeft: position.x * zoom + mapOffset.x,
          mapTop: position.y * zoom + mapOffset.y
        };
      }),
    [mapOffset.x, mapOffset.y, zoom]
  );

  const visibleVMs = useMemo(
    () =>
      transformedVMs.filter(
        (vm) => vm.mapLeft >= -54 && vm.mapLeft <= MAP_WIDTH && vm.mapTop >= -60 && vm.mapTop <= MAP_HEIGHT
      ),
    [transformedVMs]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: (event) => {
          gestureStart.current = {
            x: mapOffset.x,
            y: mapOffset.y,
            zoom,
            distance: getTouchDistance(event)
          };
        },
        onPanResponderMove: (event, gestureState) => {
          if (event.nativeEvent.touches.length >= 2) {
            const nextDistance = getTouchDistance(event);
            const startDistance = gestureStart.current.distance || nextDistance;
            const nextZoom = clamp(
              gestureStart.current.zoom * (nextDistance / Math.max(startDistance, 1)),
              MIN_ZOOM,
              MAX_ZOOM
            );
            setZoom(nextZoom);
            return;
          }

          setMapOffset({
            x: gestureStart.current.x + gestureState.dx,
            y: gestureStart.current.y + gestureState.dy
          });
        }
      }),
    [mapOffset.x, mapOffset.y, zoom]
  );

  async function openDirections(address: string) {
    const destination = encodeURIComponent(address);
    const googleMapsAppUrl = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
    const googleMapsWebUrl =
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    if (await Linking.canOpenURL(googleMapsAppUrl)) {
      await Linking.openURL(googleMapsAppUrl);
      return;
    }

    await Linking.openURL(googleMapsWebUrl);
  }

  return (
    <Screen
      title="VM Map"
      eyebrow="Nearby vending machines"
      scrollKey="vm-map"
    >
      <View style={styles.mapPreview} {...panResponder.panHandlers}>
        <View style={[styles.mapLayer, { transform: [{ translateX: mapOffset.x }, { translateY: mapOffset.y }, { scale: zoom }] }]}>
          <View style={styles.gridLineH} />
          <View style={styles.gridLineV} />
        </View>
        {transformedVMs.map((vm) => (
          <MapPin
            key={vm.id}
            vmId={vm.id}
            label={vm.mapLabel}
            top={vm.mapTop}
            left={vm.mapLeft}
            active={vm.status === "Online"}
            onPress={onOpenVM}
          />
        ))}
        <View style={styles.mapControls}>
          <MapControlButton icon="add" onPress={() => setZoom((value) => clamp(value + 0.15, MIN_ZOOM, MAX_ZOOM))} />
          <MapControlButton icon="remove" onPress={() => setZoom((value) => clamp(value - 0.15, MIN_ZOOM, MAX_ZOOM))} />
          <MapControlButton
            icon="locate-outline"
            onPress={() => {
              setZoom(1);
              setMapOffset({ x: 0, y: 0 });
            }}
          />
        </View>
        <Text style={styles.mapLabel}>Drag to move · pinch to zoom</Text>
      </View>

      <SectionHeader title="VMs in Current View" action={`${visibleVMs.length} shown`} />
      {visibleVMs.map((vm) => (
        <AppCard key={vm.id} style={styles.vmCard}>
          <BaseListItem
            leading={{ type: "visual", image: robotVisualAsset, backgroundColor: colors.tint }}
            title={vm.name}
            primary={vm.highlight}
            secondary={`${vm.distance} · ${vm.status}`}
            trailing={{ type: "chevron" }}
            onPress={() => onOpenVM(vm.id)}
            last
          />
          <View style={styles.mapMetrics}>
            <VMStat
              label="Status"
              value={vm.status}
              icon={vm.status === "Online" ? "checkmark-circle-outline" : "alert-circle-outline"}
              positive={vm.status === "Online"}
            />
            <VMStat label="Type" value={vm.machineType} icon="albums-outline" />
            <VMStat
              label="Distance"
              value={vm.distance}
              icon="navigate-outline"
              onPress={() => openDirections(vm.address)}
            />
          </View>
        </AppCard>
      ))}
      {visibleVMs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No VMs in this area</Text>
          <Text style={styles.emptyText}>Move or zoom the map to discover nearby vending machines.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function getTouchDistance(event: GestureResponderEvent) {
  const [first, second] = event.nativeEvent.touches;
  if (!first || !second) {
    return 0;
  }
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function MapControlButton({
  icon,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.mapControlButton}
      onPress={onPress}
      activeOpacity={0.84}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
    </TouchableOpacity>
  );
}

function VMStat({
  label,
  value,
  icon,
  positive,
  onPress
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  positive?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={17} color={positive ? colors.success : onPress ? colors.blue : colors.muted} />
      <Text style={styles.mapMetricLabel}>{label}</Text>
      <Text style={[styles.mapMetricValue, positive && styles.mapMetricValuePositive, onPress && styles.mapMetricValueAction]} numberOfLines={1}>
        {value}
      </Text>
      {onPress ? (
        <View style={styles.mapMetricChevron}>
          <Ionicons name="chevron-forward" size={15} color={colors.blue} />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.mapMetricTile, styles.mapMetricTileAction]} onPress={onPress} activeOpacity={0.84}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.mapMetricTile}>
      {content}
    </View>
  );
}

function MapPin({
  vmId,
  label,
  top,
  left,
  active,
  onPress
}: {
  vmId: string;
  label: string;
  top: number;
  left: number;
  active?: boolean;
  onPress: (vmId: string) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Open VM ${label} detail`}
      style={[styles.pin, { top, left }, active && styles.pinActive]}
      onPress={() => onPress(vmId)}
    >
      <Ionicons name="location" size={22} color={active ? "#FFFFFF" : colors.ink} />
      <Text style={[styles.pinLabel, active && styles.pinLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mapPreview: {
    width: "100%",
    height: 280,
    borderRadius: 8,
    backgroundColor: "#DEE7DF",
    overflow: "hidden",
    position: "relative",
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  mapLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT
  },
  gridLineH: {
    position: "absolute",
    top: 142,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.48)"
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 165,
    width: 30,
    backgroundColor: "rgba(255,255,255,0.42)"
  },
  mapLabel: {
    position: "absolute",
    left: 16,
    top: 14,
    minHeight: 24,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.76)",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  mapControls: {
    position: "absolute",
    right: 12,
    top: 12,
    gap: 8
  },
  mapControlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  pin: {
    position: "absolute",
    width: 48,
    height: 54,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  pinActive: {
    backgroundColor: colors.coffee
  },
  pinLabel: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1
  },
  pinLabelActive: {
    color: "#FFFFFF"
  },
  vmCard: {
    gap: 14,
    marginBottom: 10
  },
  mapMetrics: {
    flexDirection: "row",
    gap: 8
  },
  mapMetricTile: {
    flex: 1,
    minHeight: 76,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative"
  },
  mapMetricTileAction: {
    backgroundColor: "#F2F8FC",
    borderColor: "#BFD6E6"
  },
  mapMetricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7
  },
  mapMetricValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3
  },
  mapMetricValuePositive: {
    color: colors.success
  },
  mapMetricValueAction: {
    color: colors.blue
  },
  mapMetricChevron: {
    position: "absolute",
    right: 7,
    bottom: 7
  },
  emptyState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center"
  }
});
