/**
 * AdMob ad unit configuration.
 *
 * In development (__DEV__) we always serve Google's official test ad unit IDs —
 * clicking on real ads from a dev build is a policy violation and can get the
 * AdMob account banned.
 *
 * In production we serve the real AdMob unit IDs created in the dashboard.
 *
 * TODO: replace IOS_* placeholders with real iOS ad unit IDs once they are
 * created in the AdMob console (currently falling back to Google test IDs).
 */
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// Android production ad unit IDs (from AdMob console)
const PROD_ANDROID_INTERSTITIAL = "ca-app-pub-4216862763820451/1947089838";
const PROD_ANDROID_REWARDED = "ca-app-pub-4216862763820451/4694639695";

// iOS production ad unit IDs — NOT YET CREATED.
// Using Google's test IDs as a placeholder so the app still functions on iOS.
const PROD_IOS_INTERSTITIAL = TestIds.INTERSTITIAL;
const PROD_IOS_REWARDED = TestIds.REWARDED;

export const INTERSTITIAL_AD_UNIT_ID: string = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      android: PROD_ANDROID_INTERSTITIAL,
      ios: PROD_IOS_INTERSTITIAL,
      default: TestIds.INTERSTITIAL,
    })!;

export const REWARDED_AD_UNIT_ID: string = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      android: PROD_ANDROID_REWARDED,
      ios: PROD_IOS_REWARDED,
      default: TestIds.REWARDED,
    })!;

// Minimum interval between two interstitial ads (ms).
// Prevents annoying the user with back-to-back ads and stays within Play Store
// policy for prank apps.
export const INTERSTITIAL_MIN_INTERVAL_MS = 60_000;
