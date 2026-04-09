/**
 * Backend API for app version check.
 * Set EXPO_PUBLIC_APP_VERSIONS_API_URL in .env to override (e.g. for staging).
 */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_APP_VERSIONS_API_URL as string | undefined)) ||
  "https://quiz-app-backend-production-cd1c.up.railway.app";

export const APP_VERSIONS_URL = `${API_BASE_URL}/app-versions`;
