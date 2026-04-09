/**
 * NeonButton - gradient tugma, neon shadow/glow bilan
 */
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface NeonButtonProps {
  title: string;
  colors: readonly [string, string, string];
  glowColor: string;
  imageSource: number;
  onPress: () => void;
  wrapStyle?: object;
  imageStyle?: object;
}

export function NeonButton({
  title,
  colors,
  glowColor,
  imageSource,
  onPress,
  wrapStyle,
  imageStyle,
}: NeonButtonProps) {
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 22,
    },
    android: {},
  });

  return (
    <View style={[styles.wrap, shadowStyle, wrapStyle]}>
      <View style={[styles.glowRing, { borderColor: glowColor }]} />
      {Platform.OS === "android" && (
        <View style={[styles.glowBg, { backgroundColor: glowColor }]} />
      )}
      <Pressable
        style={({ pressed }) => [styles.inner, pressed && styles.pressed]}
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.3)" }}
      >
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </Pressable>
      <Image
        source={imageSource}
        style={[styles.image, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
    opacity: 0.7,
  },
  glowBg: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 18,
    opacity: 0.28,
  },
  inner: {
    borderRadius: 16,
    minHeight: 68,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.92,
  },
  content: {
    flexDirection: "row",
    paddingVertical: 22,
    paddingHorizontal: 24,
    paddingRight: 88,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
  },
  image: {
    width: 72,
    height: 72,
    position: "absolute",
    right: 12,
    top: -25,
  },
});
