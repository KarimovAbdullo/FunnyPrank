/**
 * AdMob service.
 *
 * Responsibilities:
 *   - initialize the Google Mobile Ads SDK once on app startup
 *   - keep an interstitial ad preloaded at all times (load-show-reload cycle)
 *   - expose a rate-limited `showInterstitialIfReady` for navigation triggers
 *   - expose a one-shot `showRewardedAd` helper that resolves when the user
 *     either earns the reward or dismisses the ad
 */
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

import {
  INTERSTITIAL_AD_UNIT_ID,
  INTERSTITIAL_MIN_INTERVAL_MS,
  REWARDED_AD_UNIT_ID,
} from "@/config/ads";

let initialized = false;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let lastInterstitialShownAt = 0;

export async function initAdMob(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
  } catch {
    // Ignore init errors — SDK will retry when ads are requested.
  }

  preloadInterstitial();
}

function preloadInterstitial(): void {
  const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });
  interstitial = ad;
  interstitialLoaded = false;

  const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
    unsubLoaded();
    unsubClosed();
    unsubError();
    preloadInterstitial();
  });
  const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
    unsubLoaded();
    unsubClosed();
    unsubError();
    // Back off before trying again so we don't hammer the network on flaky connections.
    setTimeout(preloadInterstitial, 5000);
  });

  ad.load();
}

/**
 * Show the preloaded interstitial if one is ready and the minimum interval
 * since the last shown ad has elapsed. Returns true if the ad was shown.
 */
export function showInterstitialIfReady(): boolean {
  if (!interstitial || !interstitialLoaded) return false;

  const now = Date.now();
  if (now - lastInterstitialShownAt < INTERSTITIAL_MIN_INTERVAL_MS) {
    return false;
  }

  lastInterstitialShownAt = now;
  interstitialLoaded = false;
  interstitial.show().catch(() => {
    // If show fails, mark as not shown so the next call can try again sooner.
    lastInterstitialShownAt = 0;
  });
  return true;
}

/**
 * Show a rewarded ad on demand. Resolves with `true` if the user earned the
 * reward, or `false` if they dismissed the ad / an error occurred.
 *
 * `onEarned` is invoked synchronously when the reward is earned, so callers
 * can unlock the feature before the ad is even fully dismissed.
 */
export function showRewardedAd(onEarned: () => void): Promise<boolean> {
  return new Promise((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    let earned = false;
    let settled = false;

    const settle = (result: boolean) => {
      if (settled) return;
      settled = true;
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
      resolve(result);
    };

    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        // Count rewarded impressions against the interstitial rate limit so
        // users don't see back-to-back ads (rewarded → interstitial on exit).
        lastInterstitialShownAt = Date.now();
        rewarded.show().catch(() => settle(false));
      },
    );
    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
        onEarned();
      },
    );
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      settle(earned);
    });
    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      settle(false);
    });

    rewarded.load();
  });
}
