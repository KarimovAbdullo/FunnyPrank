/**
 * PhotoPrankScreen - foto prank sahifasi
 * Rasm tanlash, kamera, natijada prank rasmni ko'rsatish
 */
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon, CloseIcon } from "@/components";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLS = 3;
const GAP = 8;
const THUMB_SIZE = (SCREEN_WIDTH - 40 - GAP * (COLS - 1)) / COLS;

const PHOTO_PRANK_IMAGES = [
  require("@/assets/images/photoPrank/depositphotos_70252811-stock-photo-funny-monkey-with-a-red.jpg"),
  require("@/assets/images/photoPrank/fat-orangutang.jpg"),
  require("@/assets/images/photoPrank/marzena7-donkey-3636234_1920.jpg"),
  require("@/assets/images/photoPrank/ScreenShot_20260218104729.jpeg"),
  require("@/assets/images/photoPrank/ScreenShot_20260218105018.jpeg"),
  require("@/assets/images/photoPrank/ScreenShot_20260218105104.jpeg"),
  require("@/assets/images/photoPrank/ScreenShot_20260218105139.jpeg"),
  require("@/assets/images/photoPrank/ScreenShot_20260218105206.jpeg"),
  require("@/assets/images/photoPrank/ScreenShot_20260218105308.jpeg"),
  require("@/assets/images/photoPrank/top-10-most-funny-looking-animals-in-the-world.jpg"),
];

export default function PhotoPrankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return false;
    }
    return true;
  }, []);

  const openCamera = useCallback(async () => {
    if (selectedSource == null) {
      Alert.alert("Select image", "Select one of the images below first.");
      return;
    }
    const ok = await requestCameraPermission();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    setShowResult(true);
  }, [selectedSource, requestCameraPermission]);

  const closeResult = useCallback(() => setShowResult(false), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>Photo Prank</Text>
      </View>

      <Text style={styles.hint}>Select an image, then tap the camera button</Text>

      <ScrollView contentContainerStyle={styles.gridWrap} showsVerticalScrollIndicator={false}>
        {PHOTO_PRANK_IMAGES.map((src, index) => (
          <Pressable
            key={index}
            style={[styles.thumbWrap, selectedSource === index && styles.thumbWrapSelected]}
            onPress={() => setSelectedSource(index)}
          >
            <Image source={src} style={styles.thumb} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.cameraButton} onPress={openCamera}>
        <LinearGradient
          colors={["#006b8a", "#00a3cc", "#00f5ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.cameraButtonText}>Camera</Text>
      </Pressable>

      <Modal visible={showResult} transparent animationType="fade" onRequestClose={closeResult}>
        <Pressable style={styles.modalOverlay} onPress={closeResult}>
          <View style={styles.resultCard}>
            <Pressable style={styles.closeButton} onPress={closeResult}>
              <CloseIcon />
            </Pressable>
            <View style={styles.resultImageWrap}>
              {selectedSource != null && (
                <Image source={PHOTO_PRANK_IMAGES[selectedSource]} style={styles.resultImage} resizeMode="contain" />
              )}
            </View>
            <Text style={styles.resultHint}>Tap to close</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, position: "relative" },
  backBtn: { paddingVertical: 8, paddingRight: 12, zIndex: 1 },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  hint: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 16 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingBottom: 24 },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbWrapSelected: { borderColor: "#00f5ff" },
  thumb: { width: "100%", height: "100%" },
  cameraButton: {
    minHeight: 52,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  cameraButtonText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  resultCard: { width: "100%", height: "80%", borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
  closeButton: { position: "absolute", top: 12, right: 12, zIndex: 10, padding: 8 },
  resultImageWrap: { flex: 1, backgroundColor: "#000" },
  resultImage: { width: "100%", height: "100%" },
  resultHint: { textAlign: "center", color: "rgba(255,255,255,0.7)", paddingVertical: 12, fontSize: 14 },
});
