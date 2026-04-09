/**
 * SoundPrankScreen - ovoz prank sahifasi
 * Fart / Ghost / Animals kategoriyalari, play/pause, qayta sanoq (delay) modali
 */
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon } from "@/components";

const DELAY_OPTIONS = [0, 5, 10, 15, 30, 60] as const;

const FART_SOUNDS = [
  require("@/assets/sounds/fart/beanfrog-proud-fart-288263.mp3"),
  require("@/assets/sounds/fart/freesound_community-fart-83471.mp3"),
  require("@/assets/sounds/fart/freesound_community-fartbumtrumpetpoop-99028.mp3"),
  require("@/assets/sounds/fart/freesound_community-wet-fart-6139.mp3"),
  require("@/assets/sounds/fart/u_ngsgp0r6zb-burp1-201176.mp3"),
];

const GHOST_SOUNDS = [
  require("@/assets/sounds/gohst/colto-woman-scream-136558.mp3"),
  require("@/assets/sounds/gohst/dragon-studio-creepy-ghost-whisper-410564.mp3"),
  require("@/assets/sounds/gohst/dragon-studio-ghost-horror-sound-382709.mp3"),
  require("@/assets/sounds/gohst/dragon-studio-woman-screaming-sfx-screaming-sound-effect-320169.mp3"),
  require("@/assets/sounds/gohst/helamangile-whisper-voices-1-193087.mp3"),
  require("@/assets/sounds/gohst/universfield-male-death-scream-horror-352706.mp3"),
];

const ANIMALS_SOUNDS = [
  require("@/assets/sounds/animals/audiopapkin-barking-large-and-small-dog-290711.mp3"),
  require("@/assets/sounds/animals/dragon-studio-cat-meow-401729.mp3"),
  require("@/assets/sounds/animals/freesound_community-flying-mosquito-105770.mp3"),
  require("@/assets/sounds/animals/freesound_community-killer-bee-attack-71197.mp3"),
  require("@/assets/sounds/animals/freesound_community-mosquito-buzz-70605.mp3"),
  require("@/assets/sounds/animals/freesound_community-single-mosquito-buzz-69360.mp3"),
  require("@/assets/sounds/animals/kuzu420-fly-buzzing-from-left-to-right-337281.mp3"),
  require("@/assets/sounds/animals/u_jd81cxyq22-cow-mooing-343423.mp3"),
];

/** Soniyalarni MM:SS formatiga o'zgartiradi */
function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SoundPrankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedDelaySec, setSelectedDelaySec] = useState(0);
  const [countdownIndex, setCountdownIndex] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const sounds =
    category === "fart"
      ? FART_SOUNDS
      : category === "ghost"
        ? GHOST_SOUNDS
        : category === "animals"
          ? ANIMALS_SOUNDS
          : [];
  const title =
    category === "fart"
      ? "Fart sound"
      : category === "ghost"
        ? "Ghost sound"
        : category === "animals"
          ? "Animals and insects"
          : "Sounds";
  const isFart = category === "fart";
  const isGhost = category === "ghost";
  const isAnimals = category === "animals";

  const playSound = useCallback(
    async (index: number) => {
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (_) {}
        soundRef.current = null;
      }
      setPlayingIndex(index);
      try {
        const { sound } = await Audio.Sound.createAsync(sounds[index]);
        soundRef.current = sound;
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          const finished =
            status.didJustFinishAndNotReset ||
            (typeof status.durationMillis === "number" &&
              typeof status.positionMillis === "number" &&
              status.durationMillis > 0 &&
              status.positionMillis >= status.durationMillis - 300);
          if (finished) {
            setPlayingIndex(null);
            soundRef.current = null;
            sound.unloadAsync().catch(() => {});
          }
        });
      } catch (_) {
        setPlayingIndex(null);
      }
    },
    [sounds]
  );

  const onRowPress = useCallback(
    (index: number) => {
      if (selectedDelaySec === 0) {
        playSound(index);
        return;
      }
      if (countdownIndex !== null) return;
      setCountdownIndex(index);
      setCountdownSec(selectedDelaySec);
      countdownIntervalRef.current = setInterval(() => {
        setCountdownSec((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setCountdownIndex(null);
            playSound(index);
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [selectedDelaySec, countdownIndex, playSound]
  );

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const pickDelay = (sec: number) => {
    setSelectedDelaySec(sec);
    if (sec !== 0) setShowDelayModal(false);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </Pressable>
        <View style={styles.headerSpacer} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {(isFart || isGhost || isAnimals) && (
          <Pressable
            onPress={() => setShowDelayModal(true)}
            style={styles.headerRight}
          >
            <Image
              source={require("@/assets/images/time2.webp")}
              style={styles.time2Image}
              resizeMode="contain"
            />
          </Pressable>
        )}
        {!(isFart || isGhost || isAnimals) && <View style={styles.headerRight} />}
      </View>

      {isFart && (
        <View style={styles.headerImageWrap}>
          <Image
            source={require("@/assets/images/head.webp")}
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>
      )}
      {isGhost && (
        <View style={styles.headerImageWrap}>
          <Image
            source={require("@/assets/images/ghost.png")}
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>
      )}
      {isAnimals && (
        <View style={styles.headerImageWrap}>
          <Image
            source={require("@/assets/images/animal.webp")}
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {sounds.map((_, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => onRowPress(index)}
          >
            <LinearGradient
              colors={["#4a0060", "#8010a0", "#b030d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.playIconWrap}>
              {playingIndex === index ? (
                <Ionicons name="pause" size={24} color="#fff" />
              ) : (
                <Ionicons name="play" size={28} color="#fff" />
              )}
            </View>
            <Text style={styles.rowLabel}>Sound {index + 1}</Text>
            {countdownIndex === index && countdownSec > 0 ? (
              <Text style={styles.timerText}>
                {formatCountdown(countdownSec)}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={showDelayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDelayModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDelayModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Choose countdown:</Text>
            {DELAY_OPTIONS.map((sec) => (
              <Pressable
                key={sec}
                style={({ pressed }) => [
                  styles.modalOption,
                  pressed && styles.modalOptionPressed,
                ]}
                onPress={() => pickDelay(sec)}
              >
                <Text style={styles.modalOptionText}>{sec} sec</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
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
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerRight: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  time2Image: {
    width: 40,
    height: 40,
  },
  headerImageWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerImage: {
    width: 200,
    height: 200,
  },
  headerSpacer: {
    flex: 1,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  rowPressed: {
    opacity: 0.9,
  },
  playIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22c55e",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  modalOptionPressed: {
    opacity: 0.8,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
