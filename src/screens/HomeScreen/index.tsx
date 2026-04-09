/**
 * HomeScreen - main screen
 * Neon buttons: Photo Prank, Sound Prank, Fake Call, Spinner
 */
import * as Application from "expo-application";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimalsIcon, NeonButton } from "@/components";

const SOUND_SUBCATEGORIES = [
  {
    id: "fart",
    label: "Fart sound",
    icon: require("@/assets/images/buttons/fart.webp") as number,
  },
  {
    id: "ghost",
    label: "Ghost sound",
    icon: require("@/assets/images/buttons/ghost.png") as number,
  },
  { id: "animals", label: "Animals and insects", icon: null },
] as const;

const SUBLIST_HEIGHT = 170;
const PROD_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-4216862763820451/1947089838";
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : PROD_INTERSTITIAL_AD_UNIT_ID;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function SoundPrankExpandable({
  onSelectCategory,
}: {
  onSelectCategory: (category: "fart" | "ghost" | "animals") => void;
}) {
  const expandedRef = useRef(false);
  const heightVal = useSharedValue(0);

  const toggle = () => {
    expandedRef.current = !expandedRef.current;
    heightVal.value = withTiming(expandedRef.current ? SUBLIST_HEIGHT : 0, {
      duration: 280,
    });
  };

  const animatedSubStyle = useAnimatedStyle(() => ({
    height: heightVal.value,
    overflow: "hidden" as const,
  }));

  return (
    <View style={styles.soundWrap}>
      <NeonButton
        title="Sound Prank"
        colors={["#6a0080", "#b030d4", "#ff00ff"]}
        glowColor="#ff00ff"
        imageSource={require("@/assets/images/buttons/sound.webp")}
        onPress={toggle}
        imageStyle={{ width: 120, height: 100, right: -10, top: -30 }}
      />
      <Animated.View style={animatedSubStyle}>
        <View style={styles.subcategoryList}>
          {SOUND_SUBCATEGORIES.map((sub) => (
            <Pressable
              key={sub.id}
              style={({ pressed }) => [
                styles.subcategoryRow,
                pressed && styles.subcategoryRowPressed,
              ]}
              onPress={() => {
                if (
                  sub.id === "fart" ||
                  sub.id === "ghost" ||
                  sub.id === "animals"
                ) {
                  onSelectCategory(sub.id);
                }
              }}
            >
              <LinearGradient
                colors={["#4a0060", "#8010a0", "#b030d4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.subcategoryLabel}>{sub.label}</Text>
              {sub.id === "animals" ? (
                <View style={styles.subcategoryIconWrap}>
                  <AnimalsIcon size={26} />
                </View>
              ) : sub.icon != null ? (
                <Image
                  source={sub.icon}
                  style={styles.subcategoryIcon}
                  resizeMode="contain"
                />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const interstitialRef = useRef(
    InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID),
  );
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const openAttemptRef = useRef(0);
  const [appVersion] = useState(
    () => Application.nativeApplicationVersion ?? "1.0.0",
  );
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);

  useEffect(() => {
    const interstitial = interstitialRef.current;

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => setIsInterstitialLoaded(true),
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsInterstitialLoaded(false);
        const next = pendingNavigationRef.current;
        pendingNavigationRef.current = null;
        if (next) next();
        interstitial.load();
      },
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => {
        setIsInterstitialLoaded(false);
        const next = pendingNavigationRef.current;
        pendingNavigationRef.current = null;
        if (next) next();
      },
    );

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const openWithInterstitialRule = (goToScreen: () => void) => {
    // Show ads on every other transition from Home:
    // 1st open -> show, 2nd -> skip, 3rd -> show, ...
    openAttemptRef.current += 1;
    const shouldShowAd = openAttemptRef.current % 2 === 1;

    if (!shouldShowAd) {
      goToScreen();
      return;
    }

    if (!isInterstitialLoaded) {
      goToScreen();
      interstitialRef.current.load();
      return;
    }

    pendingNavigationRef.current = goToScreen;
    interstitialRef.current.show();
  };

  const openSoundCategory = (category: "fart" | "ghost" | "animals") => {
    openWithInterstitialRule(() =>
      router.push({
        pathname: "/soundPrank",
        params: { category },
      }),
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo/playstore.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.title}>Prank your friend</Text>
          <Text style={styles.description}>For fun and to lift the mood</Text>
        </View>
      </View>
      <View style={styles.items}>
        <NeonButton
          title="Foto Prank"
          colors={["#006b8a", "#00a3cc", "#00f5ff"]}
          glowColor="#00f5ff"
          imageSource={require("@/assets/images/buttons/camera.webp")}
          onPress={() => openWithInterstitialRule(() => router.push("/photoPrank"))}
          imageStyle={{ width: 140, height: 120, right: -10, top: -40 }}
        />
        <SoundPrankExpandable onSelectCategory={openSoundCategory} />
        <NeonButton
          title="Fake Call"
          colors={["#0d5c2e", "#00a854", "#39ff14"]}
          glowColor="#39ff14"
          imageSource={require("@/assets/images/fakeCall.webp")}
          onPress={() => openWithInterstitialRule(() => router.push("/fakeCall"))}
          imageStyle={{ width: 90, height: 100, right: -10, top: -20 }}
        />
        <NeonButton
          title="Spinner execute Challenge"
          colors={["#b35c00", "#e08800", "#ffab00"]}
          glowColor="#ff9100"
          imageSource={require("@/assets/images/buttons/spinner.webp")}
          onPress={() =>
            openWithInterstitialRule(() => router.push("/spinnerChallenge"))
          }
        />
        <NeonButton
          title="Prank AI Chat"
          colors={["#4a148c", "#7c43bd", "#b388ff"]}
          glowColor="#b388ff"
          imageSource={require("@/assets/images/buttons/ai.webp")}
          onPress={() =>
            openWithInterstitialRule(() => router.push("/prankAiChat"))
          }
          imageStyle={{ width: 90, height: 100, right: -10, top: -20 }}
        />
      </View>
      <Text style={[styles.versionText, { marginBottom: insets.bottom + 28 }]}>
        Version {appVersion}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 30,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    paddingTop: 18,
    marginBottom: 0,
    flexDirection: "row",
    alignSelf: "center",
  },
  logo: {
    width: 62,
    height: 62,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 24,
  },
  items: { gap: 24 },
  soundWrap: { gap: 0 },
  subcategoryList: {
    marginTop: 4,
    marginLeft: 12,
    marginRight: 12,
    paddingBottom: 8,
    gap: 6,
  },
  subcategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  subcategoryRowPressed: { opacity: 0.9 },
  subcategoryIcon: { width: 28, height: 28, marginLeft: 12 },
  subcategoryIconWrap: {
    width: 28,
    height: 28,
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  subcategoryLabel: { fontSize: 14, fontWeight: "600", color: "#fff", flex: 1 },
  versionText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
