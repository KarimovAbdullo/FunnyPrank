/**
 * SpinnerChallengeScreen - lottery wheel
 * Center wheel, Spin button, editable segment list at bottom.
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

import { BackIcon } from "@/components";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 80, 320);
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const CENTER = WHEEL_RADIUS;

const INITIAL_SEGMENTS = [
  { label: "10 push-ups", color: "#e74c3c" },
  { label: "Dance", color: "#3498db" },
  { label: "Jump 5x", color: "#2ecc71" },
  { label: "Sing a song", color: "#9b59b6" },
  { label: "Run 1 min", color: "#f39c12" },
  { label: "Free pass", color: "#1abc9c" },
  { label: "Spin again", color: "#e67e22" },
  { label: "Gift", color: "#34495e" },
  { label: "Pick a game", color: "#e91e63" },
  { label: "10 squats", color: "#00bcd4" },
];

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Bitta segment (pie slice) path - 0° yuqorida */
function getSegmentPath(
  startDeg: number,
  endDeg: number,
  r: number,
  cx: number,
  cy: number,
) {
  const startRad = degToRad(startDeg);
  const endRad = degToRad(endDeg);
  const x1 = cx + r * Math.sin(startRad);
  const y1 = cy - r * Math.cos(startRad);
  const x2 = cx + r * Math.sin(endRad);
  const y2 = cy - r * Math.cos(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

const MAX_CHARS_PER_LINE = 11;
const LONG_LABEL_THRESHOLD = 12;

/** Uzun matnni 2 yoki 3 qatorga bo‘lish (bo‘shliqda bo‘lish ustun) */
function wrapLabel(label: string): string[] {
  if (label.length <= LONG_LABEL_THRESHOLD) return [label];
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= MAX_CHARS_PER_LINE) {
      current = next;
    } else {
      if (current) lines.push(current);
      current =
        w.length <= MAX_CHARS_PER_LINE ? w : w.slice(0, MAX_CHARS_PER_LINE);
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export default function SpinnerChallengeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rotation = useSharedValue(0);
  const [segments, setSegments] = useState(INITIAL_SEGMENTS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const inputRef = useRef<TextInput>(null);

  const segmentCount = segments.length;
  const segmentAngle = segmentCount > 0 ? 360 / segmentCount : 36;

  const onSpinEnd = useCallback(() => {
    setIsSpinning(false);
    const totalDeg = rotation.value;
    const normalized = ((-totalDeg % 360) + 360) % 360;
    const segmentIndex = Math.floor(normalized / segmentAngle) % segmentCount;
    setResult(segmentsRef.current[segmentIndex]?.label ?? "");
  }, [segmentAngle, segmentCount, rotation]);

  const spin = useCallback(() => {
    if (isSpinning || segmentCount === 0) return;
    setIsSpinning(true);
    setResult(null);

    const fullSpins = 5 + Math.random() * 3;
    const randomSegment = Math.floor(Math.random() * segmentCount);
    const targetSegmentAngle = randomSegment * segmentAngle + segmentAngle / 2;
    const extraDeg = 360 - targetSegmentAngle;
    const totalRotation = fullSpins * 360 + extraDeg;

    rotation.value = withTiming(
      rotation.value + totalRotation,
      { duration: 4000 },
      (finished) => {
        if (finished) runOnJS(onSpinEnd)();
      },
    );
  }, [isSpinning, onSpinEnd, rotation, segmentCount, segmentAngle]);

  const startEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(segments[index]?.label ?? "");
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [segments],
  );

  const saveEdit = useCallback(() => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim() || segments[editingIndex]?.label || "Item";
    setSegments((prev) =>
      prev.map((s, i) => (i === editingIndex ? { ...s, label: trimmed } : s)),
    );
    setEditingIndex(null);
    setEditValue("");
  }, [editingIndex, editValue, segments]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </Pressable>
          <Text style={styles.title}>Spinner execute Challenge</Text>
        </View>

        <View style={styles.wheelWrap}>
          <View style={styles.pointerWrap}>
            <View style={styles.pointer} />
          </View>

          <Animated.View style={[styles.wheelContainer, wheelStyle]}>
            <Svg
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            >
              <G x={0} y={0}>
                {segments.map((seg, i) => {
                  const startDeg = i * segmentAngle;
                  const endDeg = startDeg + segmentAngle;
                  const midDeg = startDeg + segmentAngle / 2;
                  const midRad = degToRad(midDeg);
                  const textR = WHEEL_RADIUS * 0.65;
                  const lines = wrapLabel(seg.label);
                  const isLong = lines.length > 1;
                  const lineHeight = 10;
                  const baseR = isLong ? textR + 4 : textR;
                  const fontSize = isLong ? 9 : 11;
                  const textRotation =
                    midDeg > 90 && midDeg < 270 ? midDeg + 180 : midDeg;
                  return (
                    <G key={i}>
                      <Path
                        d={getSegmentPath(
                          startDeg,
                          endDeg,
                          WHEEL_RADIUS - 4,
                          CENTER,
                          CENTER,
                        )}
                        fill={seg.color}
                        stroke="#1a1a1a"
                        strokeWidth={2}
                      />
                      {lines.map((line, lineIndex) => {
                        const r = baseR - lineIndex * lineHeight;
                        const x = CENTER + r * Math.sin(midRad);
                        const y = CENTER - r * Math.cos(midRad);
                        return (
                          <G
                            key={lineIndex}
                            transform={`rotate(${textRotation} ${x} ${y})`}
                          >
                            <SvgText
                              x={x}
                              y={y}
                              fill="#fff"
                              fontSize={fontSize}
                              fontWeight="700"
                              textAnchor="middle"
                            >
                              {line}
                            </SvgText>
                          </G>
                        );
                      })}
                    </G>
                  );
                })}
                <Path
                  d={`M ${CENTER - 20} ${CENTER} L ${CENTER} ${CENTER - 20} L ${CENTER + 20} ${CENTER} L ${CENTER} ${CENTER + 20} Z`}
                  fill="#ffab00"
                  stroke="#b35c00"
                  strokeWidth={2}
                />
              </G>
            </Svg>
          </Animated.View>
        </View>

        {result ? <Text style={styles.resultText}>{result}</Text> : null}

        <Pressable
          style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
          onPress={spin}
          disabled={isSpinning}
        >
          <LinearGradient
            colors={["#b35c00", "#e08800", "#ffab00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.spinButtonText}>
            {isSpinning ? "Spinning..." : "Spin"}
          </Text>
        </Pressable>

        <Text style={styles.listTitle}>Wheel items</Text>
        <View style={styles.itemsList}>
          {segments.map((seg, i) => (
            <View key={i} style={styles.itemRow}>
              <Pressable
                onPress={() => startEdit(i)}
                style={styles.editIconBtn}
                hitSlop={8}
              >
                <Ionicons name="pencil" size={20} color="#ffab00" />
              </Pressable>
              {editingIndex === i ? (
                <TextInput
                  ref={inputRef}
                  style={styles.itemInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  onBlur={saveEdit}
                  onSubmitEditing={saveEdit}
                  placeholder="Item text"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  blurOnSubmit={false}
                />
              ) : (
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {seg.label}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    width: "100%",
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    zIndex: 1,
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  wheelWrap: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  pointerWrap: {
    position: "absolute",
    top: -4,
    zIndex: 10,
    alignItems: "center",
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#ffab00",
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  resultText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffab00",
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spinButton: {
    minHeight: 56,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
    minWidth: 200,
  },
  spinButtonDisabled: {
    opacity: 0.8,
  },
  spinButtonText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginTop: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    width: "100%",
  },
  itemsList: {
    width: "100%",
    gap: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  editIconBtn: {
    padding: 6,
    marginRight: 10,
  },
  itemInput: {
    flex: 1,
    fontSize: 15,
    color: "white",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
});
