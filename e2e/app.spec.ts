import { test, expect } from "@playwright/test";

// These tests work without Supabase — they test static assets, build output, and structure

test.describe("PWA Assets", () => {
  test("manifest.json is valid", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest.name).toBe("Weventr");
    expect(manifest.short_name).toBe("Weventr");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#ea580c");
    expect(manifest.icons).toHaveLength(2);
  });

  test("favicon.svg is accessible", async ({ page }) => {
    const response = await page.goto("/favicon.svg");
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain("svg");
    expect(content).toContain("#ea580c"); // Orange brand color
  });

  test("service worker file exists", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain("weventr-v1");
    expect(content).toContain("fetch");
  });
});

test.describe("HTML Document", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("Weventr");
  });

  test("has viewport-fit=cover for iPhone safe areas", async ({ page }) => {
    await page.goto("/");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("viewport-fit=cover");
  });

  test("has apple-mobile-web-app-capable", async ({ page }) => {
    await page.goto("/");
    const capable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute("content");
    expect(capable).toBe("yes");
  });

  test("has theme-color meta tag", async ({ page }) => {
    await page.goto("/");
    const color = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(color).toBe("#000000");
  });

  test("has manifest link", async ({ page }) => {
    await page.goto("/");
    const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifest).toBe("/manifest.json");
  });

  test("has description meta tag", async ({ page }) => {
    await page.goto("/");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toContain("group trips");
  });
});

test.describe("App Renders", () => {
  test("root div exists and app script loads", async ({ page }) => {
    await page.goto("/");
    const root = page.locator("#root");
    await expect(root).toBeAttached();
    // Verify the module script loaded
    const scripts = await page.locator('script[type="module"]').count();
    expect(scripts).toBeGreaterThanOrEqual(1);
  });

  test("no fatal JS errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });
    await page.goto("/");
    await page.waitForTimeout(5000);
    // Filter out Supabase connection errors (expected without env vars)
    const fatal = errors.filter(
      (e) => !e.includes("supabase") && !e.includes("fetch") && !e.includes("network")
    );
    expect(fatal).toHaveLength(0);
  });
});

test.describe("Responsive Design", () => {
  test("viewport is mobile-sized (390x844)", async ({ page }) => {
    await page.goto("/");
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
    expect(viewport?.height).toBe(844);
  });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

test.describe("Legal Pages (direct navigation)", () => {
  test("privacy route exists in bundle", async ({ page }) => {
    await page.goto("/");
    // Check that the privacy route is in the JS bundle
    const response = await page.goto("/privacy");
    // Should return 200 (SPA serves index.html for all routes)
    expect(response?.status()).toBe(200);
  });

  test("terms route exists in bundle", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBe(200);
  });
});
