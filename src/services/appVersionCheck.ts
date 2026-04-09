import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { APP_VERSIONS_URL } from "../config/backend";

export interface AppVersionInfo {
  version: string;
  versionCode: number | null;
  platform: "android" | "ios";
}

/**
 * Returns current app version info (from app.config / native build).
 */
export function getAppVersionInfo(): AppVersionInfo {
  const version =
    Application.nativeApplicationVersion ??
    (Constants.expoConfig as { version?: string } | undefined)?.version ??
    "1.0.0";
  const versionCode =
    Platform.OS === "android"
      ? (Constants.expoConfig as { android?: { versionCode?: number } } | undefined)
          ?.android?.versionCode ?? null
      : null;

  return {
    version,
    versionCode,
    platform: Platform.OS as "android" | "ios",
  };
}

/** Bir sessiyada faqat bir marta so'rov yuboriladi. */
let hasReportedThisSession = false;

/**
 * Ilovaga kirganda backendga GET /app-versions so'rovini bir marta yuboradi.
 * Query params: version, versionCode (android), platform.
 */
export async function reportAppVersionOnce(): Promise<void> {
  if (hasReportedThisSession) return;
  hasReportedThisSession = true;

  const { version, versionCode, platform } = getAppVersionInfo();
  const url = new URL(APP_VERSIONS_URL);
  url.searchParams.set("version", version);
  if (versionCode != null) url.searchParams.set("versionCode", String(versionCode));
  url.searchParams.set("platform", platform);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok && __DEV__) {
      console.warn("[appVersionCheck]", res.status, await res.text());
    }
  } catch (e) {
    if (__DEV__) console.warn("[appVersionCheck]", e);
  }
}
