/**
 * Premium / ad-gated feature state.
 *
 * Two independent entitlements:
 *
 *  1. AI Chat credits — persistent across app restarts (AsyncStorage).
 *     First install grants 1 free credit. Each sent message consumes 1,
 *     each rewarded ad grants 1.
 *
 *  2. Sound Prank long-timer unlock — in-memory only (module-level), so the
 *     unlock survives screen navigation but is lost on app kill. Users must
 *     watch a rewarded ad again after relaunching the app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const AI_CHAT_CREDITS_KEY = "ai_chat_credits_v1";
const INITIAL_FREE_CREDITS = 1;

let cachedCredits: number | null = null;
const creditsListeners = new Set<(credits: number) => void>();

async function loadCredits(): Promise<number> {
  if (cachedCredits !== null) return cachedCredits;
  try {
    const raw = await AsyncStorage.getItem(AI_CHAT_CREDITS_KEY);
    if (raw === null) {
      cachedCredits = INITIAL_FREE_CREDITS;
      await AsyncStorage.setItem(
        AI_CHAT_CREDITS_KEY,
        String(INITIAL_FREE_CREDITS),
      );
    } else {
      const parsed = parseInt(raw, 10);
      cachedCredits = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
  } catch {
    cachedCredits = INITIAL_FREE_CREDITS;
  }
  return cachedCredits;
}

async function writeCredits(value: number): Promise<void> {
  cachedCredits = value;
  creditsListeners.forEach((l) => l(value));
  try {
    await AsyncStorage.setItem(AI_CHAT_CREDITS_KEY, String(value));
  } catch {
    // Swallow write errors — in-memory cache still reflects the new value.
  }
}

export async function getAiChatCredits(): Promise<number> {
  return loadCredits();
}

/** Returns true if a credit was consumed, false if balance was already 0. */
export async function consumeAiChatCredit(): Promise<boolean> {
  const current = await loadCredits();
  if (current <= 0) return false;
  await writeCredits(current - 1);
  return true;
}

export async function addAiChatCredit(): Promise<void> {
  const current = await loadCredits();
  await writeCredits(current + 1);
}

/**
 * React hook that returns the live AI chat credit balance.
 * Updates when credits are consumed or added anywhere in the app.
 */
export function useAiChatCredits(): number {
  const [credits, setCredits] = useState<number>(cachedCredits ?? 0);
  useEffect(() => {
    let cancelled = false;
    loadCredits().then((c) => {
      if (!cancelled) setCredits(c);
    });
    creditsListeners.add(setCredits);
    return () => {
      cancelled = true;
      creditsListeners.delete(setCredits);
    };
  }, []);
  return credits;
}

// --- Sound Prank long-timer unlock (session-only) ---

let soundPrankLongTimerUnlocked = false;

export function isSoundPrankLongTimerUnlocked(): boolean {
  return soundPrankLongTimerUnlocked;
}

export function unlockSoundPrankLongTimer(): void {
  soundPrankLongTimerUnlocked = true;
}

/** Timers strictly greater than this threshold (seconds) require an ad unlock. */
export const SOUND_PRANK_FREE_TIMER_MAX_SEC = 5;
