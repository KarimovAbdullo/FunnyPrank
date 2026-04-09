/**
 * FakeCallScreen - fake incoming call UI
 * Editable caller name, number, profile image. Ringtone plays until answer/decline.
 */
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_NAME = "Mrinal";
const DEFAULT_NUMBER = "Mobile 9876543210";

const DELAY_OPTIONS = [5, 10, 15, 30, 60] as const;

// Ringtone from assets
const RINGTONE_SOURCE = require("@/assets/sounds/galaxy_bells.mp3");

export default function FakeCallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [callerName, setCallerName] = useState(DEFAULT_NAME);
  const [callerNumber, setCallerNumber] = useState(DEFAULT_NUMBER);
  const [callerImageUri, setCallerImageUri] = useState<string | null>(null);
  const [delaySeconds, setDelaySeconds] = useState<number>(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRinging = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
  }, []);

  const startRinging = useCallback(async () => {
    await stopRinging();
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(RINGTONE_SOURCE, {
        isLooping: true,
      });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (_) {
      // If galaxy_bells.mp3 is missing, add it to src/assets/sounds/
    }
  }, [stopRinging]);

  const startFakeCall = useCallback(() => {
    setShowEditModal(false);
    setCountdown(delaySeconds);
    const deadline = Date.now() + delaySeconds * 1000;
    countdownRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCountdown(left);
      if (left <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown(null);
        setShowCallScreen(true);
        startRinging();
      }
    }, 200);
  }, [delaySeconds, startRinging]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      stopRinging();
    };
  }, [stopRinging]);

  const openEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const closeEdit = useCallback(() => {
    setShowEditModal(false);
  }, []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCallerImageUri(result.assets[0].uri);
    }
  }, []);

  const answerCall = useCallback(async () => {
    await stopRinging();
    Alert.alert("Call connected", "Fake call answered.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }, [stopRinging, router]);

  const declineCall = useCallback(async () => {
    await stopRinging();
    router.back();
  }, [stopRinging, router]);

  const sendMessage = useCallback(() => {
    stopRinging();
    router.back();
  }, [stopRinging, router]);

  // Setup screen: Start fake call + Edit (timer is in modal)
  if (!showCallScreen) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={["#8B4513", "#6B5B6B", "#4A4A5A"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.setupTitle}>Fake Call</Text>
        <Text style={styles.setupSubtitle}>
          {countdown !== null && countdown > 0
            ? `Call in ${countdown} sec...`
            : "Set caller & timer, then start"}
        </Text>
        <Pressable style={styles.setupEditBtn} onPress={openEdit}>
          <Ionicons name="pencil" size={22} color="#fff" />
          <Text style={styles.setupEditBtnText}>Edit caller & timer</Text>
        </Pressable>
        <Pressable
          style={[styles.setupStartBtn, (countdown !== null && countdown > 0) && styles.setupStartBtnDisabled]}
          onPress={startFakeCall}
          disabled={countdown !== null && countdown > 0}
        >
          <Text style={styles.setupStartBtnText}>Start fake call</Text>
        </Pressable>

        <Modal visible={showEditModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={closeEdit}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Edit caller</Text>

              <Pressable onPress={pickImage} style={styles.editAvatarWrap}>
                {callerImageUri ? (
                  <Image source={{ uri: callerImageUri }} style={styles.editAvatar} resizeMode="cover" />
                ) : (
                  <View style={[styles.editAvatar, styles.editAvatarPlaceholder]}>
                    <Ionicons name="person" size={40} color="#999" />
                  </View>
                )}
                <View style={styles.editAvatarBadge}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </Pressable>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={callerName}
                onChangeText={setCallerName}
                placeholder="Caller name"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Number / label</Text>
              <TextInput
                style={styles.input}
                value={callerNumber}
                onChangeText={setCallerNumber}
                placeholder="e.g. Mobile 9876543210"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Call after (timer)</Text>
              <View style={styles.timerRow}>
                {DELAY_OPTIONS.map((sec) => (
                  <Pressable
                    key={sec}
                    style={[styles.timerOption, delaySeconds === sec && styles.timerOptionActive]}
                    onPress={() => setDelaySeconds(sec)}
                  >
                    <Text style={[styles.timerOptionText, delaySeconds === sec && styles.timerOptionTextActive]}>
                      {sec}s
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.modalBtn} onPress={closeEdit}>
                  <Text style={styles.modalBtnText}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Incoming call screen
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={["#8B4513", "#6B5B6B", "#4A4A5A"]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable style={styles.editBtn} onPress={openEdit}>
        <Ionicons name="pencil" size={24} color="#fff" />
      </Pressable>

      <View style={styles.callContent}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
          <Text style={styles.incomingLabel}>Incoming call</Text>
        </View>

        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callerNumber}>{callerNumber}</Text>

        <View style={styles.avatarWrap}>
          {callerImageUri ? (
            <Image source={{ uri: callerImageUri }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={80} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.answerBtn} onPress={answerCall}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "45deg" }] }} />
        </Pressable>
        <View style={styles.actionsGap} />
        <Pressable style={styles.declineBtn} onPress={declineCall}>
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
      </View>

      <Pressable style={styles.sendMessageWrap} onPress={sendMessage}>
        <Text style={styles.sendMessageText}>Send message</Text>
      </Pressable>

      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeEdit}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit caller</Text>

            <Pressable onPress={pickImage} style={styles.editAvatarWrap}>
              {callerImageUri ? (
                <Image source={{ uri: callerImageUri }} style={styles.editAvatar} resizeMode="cover" />
              ) : (
                <View style={[styles.editAvatar, styles.editAvatarPlaceholder]}>
                  <Ionicons name="person" size={40} color="#999" />
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </Pressable>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={callerName}
              onChangeText={setCallerName}
              placeholder="Caller name"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Number / label</Text>
            <TextInput
              style={styles.input}
              value={callerNumber}
              onChangeText={setCallerNumber}
              placeholder="e.g. Mobile 9876543210"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Call after (timer)</Text>
            <View style={styles.timerRow}>
              {DELAY_OPTIONS.map((sec) => (
                <Pressable
                  key={sec}
                  style={[styles.timerOption, delaySeconds === sec && styles.timerOptionActive]}
                  onPress={() => setDelaySeconds(sec)}
                >
                  <Text style={[styles.timerOptionText, delaySeconds === sec && styles.timerOptionTextActive]}>
                    {sec}s
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={closeEdit}>
                <Text style={styles.modalBtnText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5a4a4a",
  },
  editBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  callContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 8,
  },
  badge: {
    width: 28,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  incomingLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  callerName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 32,
  },
  callerNumber: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 8,
  },
  avatarWrap: {
    alignSelf: "center",
    marginTop: 28,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(200,140,80,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 40,
    gap: 48,
  },
  actionsGap: {
    width: 48,
  },
  answerBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  declineBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sendMessageWrap: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingBottom: 16,
  },
  sendMessageText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
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
    maxWidth: 340,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  editAvatarWrap: {
    alignSelf: "center",
    marginBottom: 20,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarPlaceholder: {
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  modalActions: {
    marginTop: 8,
  },
  modalBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 60,
    textAlign: "center",
  },
  setupSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  setupEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    alignSelf: "center",
  },
  setupEditBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  setupStartBtn: {
    marginTop: 24,
    paddingVertical: 18,
    paddingHorizontal: 48,
    backgroundColor: "#22c55e",
    borderRadius: 16,
    alignSelf: "center",
  },
  setupStartBtnDisabled: {
    opacity: 0.6,
  },
  setupStartBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  timerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  timerOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#334155",
  },
  timerOptionActive: {
    backgroundColor: "#3498db",
  },
  timerOptionText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  timerOptionTextActive: {
    color: "#fff",
  },
});
