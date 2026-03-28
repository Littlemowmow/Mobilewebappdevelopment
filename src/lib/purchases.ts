import { Purchases } from "@revenuecat/purchases-js";

const RC_API_KEY = import.meta.env.VITE_REVENUECAT_KEY || "";

let purchasesInstance: Purchases | null = null;

export function initPurchases(appUserId: string): Purchases | null {
  if (!RC_API_KEY) {
    if (import.meta.env.DEV) {
      console.warn("[purchases] VITE_REVENUECAT_KEY not set — purchases disabled");
    }
    return null;
  }
  if (purchasesInstance) return purchasesInstance;
  purchasesInstance = Purchases.configure(RC_API_KEY, appUserId);
  return purchasesInstance;
}

export function getPurchases(): Purchases | null {
  return purchasesInstance;
}

export async function getOfferings() {
  if (!purchasesInstance) return null;
  try {
    return await purchasesInstance.getOfferings();
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[purchases] Failed to get offerings:", err);
    return null;
  }
}

export async function getCustomerInfo() {
  if (!purchasesInstance) return null;
  try {
    return await purchasesInstance.getCustomerInfo();
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[purchases] Failed to get customer info:", err);
    return null;
  }
}
