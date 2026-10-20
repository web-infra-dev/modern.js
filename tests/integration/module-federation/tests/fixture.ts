import puppeteer, { type Browser, type Page } from 'puppeteer';
import { startLab } from '../scripts/lab.mjs';
const selector = (id: string) => `[data-testid="${id}"]`;

export function setupLab(mode: 'dev' | 'production') {
  let lab: Awaited<ReturnType<typeof startLab>>;
  let browser: Browser;
  let page: Page;
  const browserErrors: string[] = [];
  let expectsRecovery = false;
  beforeAll(async () => {
    lab = await startLab(mode);
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  });
  afterAll(async () => {
    await browser?.close();
    await lab?.stop();
  });
  beforeEach(async () => {
    page = await browser.newPage();
    browserErrors.length = 0;
    expectsRecovery = false;
    page.on('pageerror', error => browserErrors.push(String(error)));
  });
  afterEach(async () => {
    await page?.close();
    if (expectsRecovery) {
      // The existing adapter renders the error fallback on the server. React
      // reports recoverable hydration errors when the two client retries succeed.
      expect(browserErrors).toHaveLength(2);
      for (const error of browserErrors)
        expect(error).toMatch(/Hydration failed|Minified React error #418/);
    } else expect(browserErrors).toEqual([]);
  });
  async function visit(route: string, id: string) {
    await page.goto(`${lab.url}/${route}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(selector(id));
  }
  async function text(id: string) {
    return page.$eval(selector(id), element => element.textContent);
  }
  async function click(id: string) {
    await page.click(selector(id));
  }
  async function counter(id: string) {
    await click(`${id}-counter`);
    await page.waitForFunction(
      sel => document.querySelector(sel)?.textContent === 'Signals received: 1',
      {},
      selector(`${id}-counter`),
    );
  }
  async function relayTools() {
    for (const [id, label] of [
      ['relay-ping', 'Relay pings'],
      ['relay-pulse', 'Local pulses'],
    ]) {
      await page.waitForSelector(selector(id));
      await click(id);
      expect(await text(id)).toBe(`${label}: 1`);
    }
  }
  return () => ({
    lab,
    page,
    visit,
    text,
    click,
    counter,
    relayTools,
    selector,
    expectRecovery() {
      expectsRecovery = true;
    },
  });
}
export type LabContext = ReturnType<typeof setupLab>;
