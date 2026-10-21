import puppeteer, { type Browser, type Page } from 'puppeteer';
import { startLab } from '../scripts/lab.mjs';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Link packages individually so node_modules/.cache remains local to each copy.
async function linkDependencies(source: string, target: string) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source)) {
    if (entry.startsWith('.') && !['.bin', '.pnpm'].includes(entry)) continue;
    const original = path.join(source, entry);
    const directory = (await stat(original)).isDirectory();
    await symlink(
      original,
      path.join(target, entry),
      directory ? (process.platform === 'win32' ? 'junction' : 'dir') : 'file',
    );
  }
}

// Each test file owns a writable copy: framework CI runs files concurrently,
// and the adapter's dev manifest middleware requires its default dist path.
async function createWorkspace() {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const workspace = await mkdtemp(path.join(tmpdir(), 'modern-mf-'));
  const excluded = new Set([
    'node_modules',
    'dist',
    'dist-v2',
    '.modern-js',
    '.rsbuild',
  ]);
  try {
    await linkDependencies(
      path.resolve(source, '../../../node_modules'),
      path.join(workspace, 'node_modules'),
    );
    for (const name of ['host', 'provider', 'nested', 'library']) {
      await cp(path.join(source, name), path.join(workspace, name), {
        recursive: true,
        filter: filename => !excluded.has(path.basename(filename)),
      });
      await linkDependencies(
        path.join(source, name, 'node_modules'),
        path.join(workspace, name, 'node_modules'),
      );
    }
    await cp(path.join(source, 'ports.ts'), path.join(workspace, 'ports.ts'));
    await cp(
      path.join(source, 'package.json'),
      path.join(workspace, 'package.json'),
    );
    return workspace;
  } catch (error) {
    await rm(workspace, { recursive: true, force: true });
    throw error;
  }
}

const selector = (id: string) => `[data-testid="${id}"]`;

export function setupLab(mode: 'dev' | 'production') {
  let lab: Awaited<ReturnType<typeof startLab>>;
  let browser: Browser;
  let workspace: string;
  let page: Page;
  const browserErrors: string[] = [];
  const consoleErrors: string[] = [];
  const pendingRequests = new Set<string>();
  let expectsRecovery = false;
  let expectedErrorGroups: { pattern: RegExp; count: number }[] | undefined;
  let expectedErrors: { pattern: RegExp; min: number; max: number } | undefined;
  beforeAll(async () => {
    workspace = await createWorkspace();
    lab = await startLab(mode, false, workspace);
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  });
  afterAll(async () => {
    try {
      await browser?.close();
    } finally {
      try {
        await lab?.stop();
      } finally {
        if (workspace) await rm(workspace, { recursive: true, force: true });
      }
    }
  });
  beforeEach(async () => {
    page = await browser.newPage();
    browserErrors.length = 0;
    consoleErrors.length = 0;
    pendingRequests.clear();
    page.on('console', message => {
      if (message.type() === 'error')
        consoleErrors.push(message.text().slice(0, 1000));
    });
    page.on('request', request => pendingRequests.add(request.url()));
    page.on('requestfinished', request =>
      pendingRequests.delete(request.url()),
    );
    page.on('requestfailed', request => {
      pendingRequests.delete(request.url());
      consoleErrors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    expectsRecovery = false;
    expectedErrors = undefined;
    expectedErrorGroups = undefined;
    page.on('pageerror', error => browserErrors.push(String(error)));
  });
  afterEach(async () => {
    await page?.close();
    if (expectedErrorGroups) {
      expect(browserErrors).toHaveLength(
        expectedErrorGroups.reduce((sum, group) => sum + group.count, 0),
      );
      for (const group of expectedErrorGroups)
        expect(
          browserErrors.filter(error => group.pattern.test(error)),
        ).toHaveLength(group.count);
    } else if (expectedErrors) {
      expect(browserErrors.length).toBeGreaterThanOrEqual(expectedErrors.min);
      expect(browserErrors.length).toBeLessThanOrEqual(expectedErrors.max);
      for (const error of browserErrors)
        expect(error).toMatch(expectedErrors.pattern);
    } else if (expectsRecovery) {
      // The existing adapter renders the error fallback on the server. React
      // reports recoverable hydration errors when the two client retries succeed.
      expect(browserErrors).toHaveLength(2);
      for (const error of browserErrors)
        expect(error).toMatch(/Hydration failed|Minified React error #418/);
    } else expect(browserErrors).toEqual([]);
  });
  async function weatherFrames(count: number) {
    await page
      .waitForFunction(
        expected => {
          const frames = Array.from(document.querySelectorAll('iframe'));
          return (
            frames.length === expected &&
            frames.every(frame =>
              frame.contentDocument?.querySelector('.weather-scene'),
            )
          );
        },
        {},
        count,
      )
      .catch(async error => {
        const state = await page.$$eval('iframe', frames =>
          frames.map(frame => ({
            url: frame.src,
            ready: frame.contentDocument?.readyState,
            body: frame.contentDocument?.body?.textContent?.slice(0, 800),
          })),
        );
        throw new Error(
          `Weather frames did not become ready: ${JSON.stringify({ frames: state, host: lab.logs.get('host-v1')?.slice(-6000) })}`,
          { cause: error },
        );
      });
    return page.frames().filter(frame => frame.url().includes('/weather?'));
  }
  async function visit(route: string, id: string) {
    await page.goto(`${lab.url}/${route}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(selector(id)).catch(async error => {
      throw new Error(
        `Remote ${id} did not render: ${JSON.stringify({
          body: await page.$eval('body', element =>
            element.textContent?.slice(-3000),
          ),
          pending: [...pendingRequests],
          consoleErrors,
          host: lab.logs.get('host-v1')?.slice(-2000),
          nested: lab.logs.get('nested-v1')?.slice(-2000),
        })}`,
        { cause: error },
      );
    });
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
      await page.waitForSelector(selector(id)).catch(async error => {
        throw new Error(
          `Remote ${id} did not render: ${JSON.stringify({
            body: await page.$eval('body', element =>
              element.textContent?.slice(-3000),
            ),
            pending: [...pendingRequests],
            consoleErrors,
            host: lab.logs.get('host-v1')?.slice(-2000),
            nested: lab.logs.get('nested-v1')?.slice(-2000),
          })}`,
          { cause: error },
        );
      });
      await click(id);
      expect(await text(id)).toBe(`${label}: 1`);
    }
  }
  return () => ({
    lab,
    workspace,
    mode,
    page,
    visit,
    text,
    click,
    counter,
    relayTools,
    weatherFrames,
    selector,
    expectErrorGroups(groups: { pattern: RegExp; count: number }[]) {
      expectedErrorGroups = groups;
    },
    expectErrors(pattern: RegExp, min: number, max: number) {
      expectedErrors = { pattern, min, max };
    },
    expectRecovery() {
      expectsRecovery = true;
    },
  });
}
export type LabContext = ReturnType<typeof setupLab>;

export function describeLab(
  name: string,
  register: (getContext: LabContext) => void,
) {
  rstest.setConfig({ testTimeout: 60000, hookTimeout: 600000, retry: 0 });
  const modes = process.env.MF_LAB_MODE
    ? [process.env.MF_LAB_MODE as 'dev' | 'production']
    : (['dev', 'production'] as const);
  for (const mode of modes) {
    describe(`Federation lab (${mode})`, () => {
      describe(name, () => register(setupLab(mode)));
    });
  }
}
