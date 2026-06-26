import { StyleSheet, View } from "react-native";
import { TierVisual } from "../tierVisuals";

export function TierCardBackdrop({ visual }: { visual: TierVisual }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.edgeBand, { borderColor: visual.secondaryAccent }]} />
      <View style={[styles.fineLine, styles.fineLineTop, { backgroundColor: visual.accent }]} />
      <View style={[styles.fineLine, styles.fineLineBottom, { backgroundColor: visual.accent }]} />
      <View style={[styles.brushedLine, styles.brushedLineOne, { backgroundColor: visual.highlight }]} />
      <View style={[styles.brushedLine, styles.brushedLineTwo, { backgroundColor: visual.shadow }]} />
      <View style={[styles.brushedLine, styles.brushedLineThree, { backgroundColor: visual.gloss }]} />
      <View style={[styles.sheen, { backgroundColor: visual.gloss }]} />
      <View style={[styles.softHighlight, { backgroundColor: visual.highlight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  edgeBand: {
    position: "absolute",
    width: 230,
    height: 230,
    top: -94,
    right: -122,
    borderRadius: 40,
    borderWidth: 34,
    opacity: 0.32,
    transform: [{ rotate: "18deg" }]
  },
  fineLine: {
    position: "absolute",
    width: 240,
    height: 1,
    right: -58,
    opacity: 0.18,
    transform: [{ rotate: "-20deg" }]
  },
  fineLineTop: {
    top: 58
  },
  fineLineBottom: {
    top: 76
  },
  brushedLine: {
    position: "absolute",
    height: 1,
    left: -26,
    right: -26,
    opacity: 0.12,
    transform: [{ rotate: "-7deg" }]
  },
  brushedLineOne: {
    top: 34
  },
  brushedLineTwo: {
    top: 96
  },
  brushedLineThree: {
    top: 132
  },
  sheen: {
    position: "absolute",
    width: 120,
    height: 260,
    top: -70,
    left: 104,
    opacity: 0.11,
    transform: [{ rotate: "24deg" }]
  },
  softHighlight: {
    position: "absolute",
    width: 190,
    height: 52,
    top: -22,
    left: 18,
    opacity: 0.16,
    borderRadius: 32,
    transform: [{ rotate: "-8deg" }]
  }
});
