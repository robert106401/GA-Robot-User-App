import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { Screen } from "../components/Screen";
import { colors } from "../theme";
import { productCopy } from "../productCopy";

type ScanPayScreenProps = {
  onVmScanSuccess: () => void;
};

type ScanState = "idle" | "scanning" | "validated";

export function ScanPayScreen({ onVmScanSuccess }: ScanPayScreenProps) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScanning = scanState === "scanning";

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleOpenCamera() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setScanState("scanning");
    timerRef.current = setTimeout(() => {
      setScanState("validated");
      timerRef.current = setTimeout(() => {
        onVmScanSuccess();
        setScanState("idle");
        timerRef.current = null;
      }, 450);
    }, 3000);
  }

  return (
    <Screen title={productCopy.scanAndPay} eyebrow="Fast checkout" scrollKey="scan-pay">
      <View style={[styles.scannerFrame, isScanning && styles.scannerFrameActive, scanState === "validated" && styles.scannerFrameSuccess]}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        {isScanning ? (
          <ActivityIndicator size="large" color={colors.blue} />
        ) : (
          <Ionicons name={scanState === "validated" ? "checkmark-circle-outline" : "scan-outline"} size={86} color={scanState === "validated" ? colors.success : colors.ink} />
        )}
        <Text style={styles.scanText}>
          {isScanning
            ? "Camera Opened"
            : scanState === "validated"
              ? "VM Scan Confirmed"
              : "Scan the QR code on the VM"}
        </Text>
        <Text style={styles.scanHint}>
          {isScanning
            ? "Waiting for the VM device to confirm the scan..."
            : scanState === "validated"
              ? "VM verified the session. Opening app payment."
              : `Pay at the VM or collect an ${productCopy.orderAhead} purchase`}
        </Text>
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isScanning ? "Camera scanning in progress" : "Open camera"}
        style={[styles.primaryButton, isScanning && styles.primaryButtonDisabled]}
        disabled={isScanning}
        onPress={handleOpenCamera}
      >
        <Ionicons name={isScanning ? "sync-outline" : "camera-outline"} size={22} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>{isScanning ? "Scanning..." : "Open Camera"}</Text>
      </TouchableOpacity>

      {scanState === "validated" ? (
        <AppCard style={styles.successCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.warningTitle}>VM Device Confirmed</Text>
          </View>
          <Text style={styles.successText}>The VM session has been validated. Continue payment in the app cashier.</Text>
        </AppCard>
      ) : null}

      <AppCard style={styles.warningCard}>
        <View style={styles.warningHeader}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
          <Text style={styles.warningTitle}>Exception states covered</Text>
        </View>
        <Text style={styles.warningText}>
          If the VM is offline, the pickup code is expired, or inventory validation fails, the app stops dispensing and shows a safe recovery message.
        </Text>
      </AppCard>

      <AppCard style={styles.flowCard}>
        <Step
          index="1"
          title={productCopy.payAtVm}
          detail="Select products on the VM, scan its payment QR, then confirm payment in the app."
        />
        <Step
          index="2"
          title={`${productCopy.orderAhead} Pickup`}
          detail="Scan a VM identity QR, select a ready Prepaid Order, and validate product availability."
        />
        <Step index="3" title="Dispense" detail="The VM is bound only after validation succeeds, then starts dispensing." />
      </AppCard>
    </Screen>
  );
}

function Step({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIndex}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scannerFrame: {
    height: 310,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#EEE8DB",
    position: "relative",
    marginBottom: 16
  },
  scannerFrameActive: {
    backgroundColor: "#EAF2F5"
  },
  scannerFrameSuccess: {
    backgroundColor: "#E8F4EF"
  },
  cornerTopLeft: {
    position: "absolute",
    top: 28,
    left: 28,
    width: 42,
    height: 42,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: colors.coffee
  },
  cornerTopRight: {
    position: "absolute",
    top: 28,
    right: 28,
    width: 42,
    height: 42,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: colors.coffee
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 28,
    left: 28,
    width: 42,
    height: 42,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: colors.coffee
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 28,
    right: 28,
    width: 42,
    height: 42,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: colors.coffee
  },
  scanText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16
  },
  scanHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center"
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryButtonDisabled: {
    opacity: 0.72
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  flowCard: {
    marginTop: 20,
    gap: 16
  },
  warningCard: {
    marginTop: 14,
    borderColor: "#F1D9A7",
    backgroundColor: "#FFF7E6"
  },
  successCard: {
    marginTop: 14,
    borderColor: "#B9D9C9",
    backgroundColor: "#F0FAF5"
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  warningTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  warningText: {
    color: colors.coffee,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 7
  },
  successText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 7
  },
  step: {
    flexDirection: "row",
    gap: 12
  },
  stepIndex: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center"
  },
  stepIndexText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  stepCopy: {
    flex: 1
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  stepDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 4
  }
});
