/**
 * Reactotron – dev loglarni kompyuterdagi Reactotron ilovasida ko'rish uchun.
 * USB orqali qurilma ulangan bo'lsa, Android'da: adb reverse tcp:9090 tcp:9090
 * yoki .env da EXPO_PUBLIC_REACTOTRON_HOST=192.168.x.x (kompyuter IP) berishingiz mumkin.
 */
import Reactotron from "reactotron-react-native";

declare global {
  interface Console {
    tron?: typeof Reactotron;
  }
}

if (__DEV__) {
  const host =
    typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_REACTOTRON_HOST as string | undefined)?.trim();
  const config: { name: string; host?: string } = { name: "Funny Prank App" };
  if (host) config.host = host;

  const tron = Reactotron.configure(config)
    .useReactNative({
      log: true,
      asyncStorage: false,
      networking: {
        ignoreUrls: /symbolicate|127\.0\.0\.1|localhost/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .connect();

  tron.clear?.();
  console.tron = tron;

  // Birinchi log – ulanishni tekshirish
  setTimeout(() => {
    console.log("Reactotron ulandi – loglar shu yerda ko'rinadi");
  }, 1500);
}

export default Reactotron;
