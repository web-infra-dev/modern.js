import type { Page } from 'puppeteer';

/**
 * Clear all cookies, localStorage, and reset Accept-Language header
 * This ensures a clean state before each test
 */
export async function clearI18nTestState(page: Page): Promise<void> {
  // Clear cookies before each test to ensure clean state
  const cookies = await page.cookies();
  for (const cookie of cookies) {
    await page.deleteCookie(cookie);
  }

  // Clear localStorage to ensure clean state (only if page is loaded)
  try {
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });
  } catch (error) {
    // Ignore SecurityError if page is not loaded yet
  }

  // Reset header to English to ensure clean state
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });
}
