import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { InfoListItem } from "../components/InfoListItem";
import { ProductListItem } from "../components/ProductListItem";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { skus, vendingMachines } from "../data/appData";
import { colors } from "../theme";
import { robotVisualAsset } from "../visualAssets";

type VMDetailScreenProps = {
  vmId: string;
  onBack: () => void;
};

export function VMDetailScreen({ vmId, onBack }: VMDetailScreenProps) {
  const vm = vendingMachines.find((item) => item.id === vmId) ?? vendingMachines[0];
  const availableSkus = skus.filter((sku) => vm.availableCategories.includes(sku.category));
  const isOnline = vm.status === "Online";

  return (
    <Screen
      title={vm.name}
      eyebrow="Vending machine details"
      scrollKey={`vm-detail-${vm.id}`}
      onBack={onBack}
      backLabel="Back to VM Map"
    >
      <AppCard style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusLabel}>Machine status</Text>
            <Text style={[styles.statusValue, isOnline && styles.statusValueOnline]}>{vm.status}</Text>
          </View>
          <View style={[styles.statusIcon, isOnline && styles.statusIconOnline]}>
            <Image source={robotVisualAsset} style={styles.statusIconImage} resizeMode="cover" />
          </View>
        </View>
        <Text style={styles.highlight}>{vm.highlight}</Text>
      </AppCard>

      {!isOnline ? (
        <AppCard style={styles.offlineCard}>
          <View style={styles.offlineHeader}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
            <Text style={styles.offlineTitle}>Pickup and Pay at VM Unavailable</Text>
          </View>
          <Text style={styles.offlineText}>
            This VM is not accepting new app payments right now. Choose another nearby VM or try again after maintenance.
          </Text>
        </AppCard>
      ) : null}

      <View style={styles.metricGrid}>
        <Metric label="Distance" value={vm.distance} icon="navigate-outline" />
        <Metric label="Inventory" value={vm.inventory} icon="cube-outline" />
        <Metric label="Temperature" value={vm.temperature} icon="thermometer-outline" />
        <Metric label="Restocked" value={vm.lastRestocked} icon="time-outline" />
      </View>

      <SectionHeader title="Location" />
      <AppCard>
        <InfoRow icon="location-outline" label="Address" value={vm.address} />
        <InfoRow icon="calendar-outline" label="Hours" value={vm.hours} last />
      </AppCard>

      <SectionHeader title="Payment Methods" />
      <View style={styles.chipRow}>
        {vm.payments.map((payment) => (
          <Text key={payment} style={styles.chip}>
            {payment}
          </Text>
        ))}
      </View>

      <SectionHeader title="Available SKUs" action={`${availableSkus.length} items`} />
      <AppCard style={styles.skuList}>
        {availableSkus.slice(0, 4).map((sku, index) => (
          <ProductListItem
            key={sku.id}
            density="compact"
            leading={{ type: "icon", icon: "cafe-outline", backgroundColor: sku.color, color: colors.onDark }}
            title={sku.name}
            primary={`${sku.category} · ${sku.stock === 0 ? "Out of Stock" : `${sku.stock} left`}`}
            amount={sku.memberPrice}
            last={index === Math.min(availableSkus.length, 4) - 1}
          />
        ))}
      </AppCard>
    </Screen>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <AppCard style={styles.metricCard}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </AppCard>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <InfoListItem
      icon={icon}
      title={label}
      text={value}
      last={last}
    />
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: colors.ink
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  statusLabel: {
    color: "#D7CEBD",
    fontSize: 13,
    fontWeight: "700"
  },
  statusValue: {
    color: "#F3D18E",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4
  },
  statusValueOnline: {
    color: "#A7E0C1"
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  statusIconImage: {
    width: "100%",
    height: "100%"
  },
  statusIconOnline: {
    backgroundColor: "rgba(167,224,193,0.14)"
  },
  highlight: {
    color: "#D7CEBD",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14
  },
  offlineCard: {
    marginTop: 12,
    borderColor: "#F1D9A7",
    backgroundColor: "#FFF7E6"
  },
  offlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  offlineTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  offlineText: {
    color: colors.coffee,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 7
  },
  metricGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    minHeight: 92
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8
  },
  metricValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4
  },
  infoRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  infoCopy: {
    flex: 1
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  infoValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    color: colors.coffee,
    backgroundColor: colors.tint,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600"
  },
  skuList: {
    paddingVertical: 4
  }
});
