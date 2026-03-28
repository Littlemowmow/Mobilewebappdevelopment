import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY) {
    if (import.meta.env.DEV && !POSTHOG_KEY) {
      console.warn("[analytics] VITE_POSTHOG_KEY not set — analytics disabled");
    }
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    loaded: () => {
      if (import.meta.env.DEV) console.log("[analytics] PostHog loaded");
    },
  });
  initialized = true;
}

export function identifyUser(userId: string, properties?: Record<string, string | null>) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export { posthog };
