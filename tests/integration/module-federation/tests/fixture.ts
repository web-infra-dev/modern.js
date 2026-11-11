import puppeteer, {
  type Browser,
  type HTTPRequest,
  type Page,
} from 'puppeteer';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { freemem, loadavg } from 'node:os';
import { startLab } from '../scripts/lab.mjs';
import { instrumentBridgeInputs } from './bridge-evidence';
import { cp, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createWorkspace } from '../scripts/workspace.mjs';

const selector = (id: string) => `[data-testid="${id}"]`;

export function setupLab(
  mode: 'dev' | 'production',
  options: {
    service?: boolean;
    basename?: string;
    hash?: boolean;
    documentBase?: string;
    clientLayoutLoaders?: boolean;
    conditionalClientRedirect?: boolean;
    initialRouteNoSSR?: boolean;
    applicationIsolation?: boolean;
    bridgeInputEvidence?: boolean;
    publicRoutesOnly?: boolean;
  } = {},
) {
  let lab: Awaited<ReturnType<typeof startLab>>;
  let browser: Browser;
  let workspace: string;
  let page: Page;
  const browserErrors: string[] = [];
  const consoleErrors: string[] = [];
  const pendingRequests = new Set<string>();
  const requestStarts = new Map<HTTPRequest, number>();
  const slowRequests: object[] = [];
  async function reportDiagnostics() {
    if (!process.env.MF_LAB_DIAGNOSTICS) return;
    const { stdout } = await promisify(execFile)('ps', [
      '-axo',
      'pid,ppid,pcpu,rss,etime,comm',
    ]);
    const rows = stdout.split('\n').flatMap(line => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
      return match
        ? [{ pid: Number(match[1]), parent: Number(match[2]), line }]
        : [];
    });
    const owned = new Set([process.pid]);
    let previousSize;
    do {
      previousSize = owned.size;
      for (const row of rows) if (owned.has(row.parent)) owned.add(row.pid);
    } while (previousSize !== owned.size);
    console.info(
      '[MF resources]',
      JSON.stringify({
        freeMemory: freemem(),
        loadAverage: loadavg(),
        processes: rows.filter(row => owned.has(row.pid)).map(row => row.line),
      }),
    );
    console.info('[MF slow requests]', JSON.stringify(slowRequests));
  }
  let expectsRecovery = false;
  let expectedErrorGroups: { pattern: RegExp; count: number }[] | undefined;
  let expectedErrors: { pattern: RegExp; min: number; max: number } | undefined;
  beforeAll(async () => {
    workspace = await createWorkspace({ service: options.service });
    if (!options.publicRoutesOnly)
      await cp(
        fileURLToPath(
          new URL('../fixtures/bridge-contracts/host', import.meta.url),
        ),
        path.join(workspace, 'host'),
        { recursive: true },
      );
    if (options.bridgeInputEvidence) await instrumentBridgeInputs(workspace);
    if (options.applicationIsolation) {
      for (const app of ['host', 'provider']) {
        await cp(
          fileURLToPath(
            new URL(
              `../fixtures/application-isolation/${app}`,
              import.meta.url,
            ),
          ),
          path.join(workspace, app),
          { recursive: true },
        );
        const config = path.join(workspace, app, 'modern.config.ts');
        await writeFile(
          config,
          `import { i18nPlugin } from '@modern-js/plugin-i18n'\n${await readFile(config, 'utf8')}`.replace(
            'plugins: [appTools()]',
            `plugins: [appTools(), i18nPlugin({ localeDetection: { localePathRedirect: true, i18nextDetector: false, languages: ['en', 'fr', 'zh'], fallbackLanguage: '${app === 'host' ? 'zh' : 'en'}', ignoreRedirectRoutes: ['/isolation', '/'] } })]`,
          ),
        );
      }
      const federation = path.join(
        workspace,
        'provider/module-federation.config.ts',
      );
      await writeFile(
        federation,
        (await readFile(federation, 'utf8')).replace(
          'exposes: {',
          "exposes: { './IsolationApp': './src/exports/IsolationApp.tsx',",
        ),
      );
    }
    if (options.conditionalClientRedirect) {
      const loader = path.join(
        workspace,
        'provider/src/routes/__applications/product/start/page.data.client.ts',
      );
      await writeFile(
        loader,
        (await readFile(loader, 'utf8')).replace(
          'const shouldRedirect = true;',
          "const shouldRedirect = sessionStorage.getItem('mf-lab-redirect-enabled') === 'true';",
        ),
      );
    }
    if (options.initialRouteNoSSR) {
      const consumer = path.join(workspace, 'host/src/routes/persistent/$.tsx');
      const source = await readFile(consumer, 'utf8');
      await writeFile(
        consumer,
        source.replace(
          "remote: () => loadRemote('provider/ProductApp'),",
          "remote: () => loadRemote('provider/ProductApp'), noSSR: true,",
        ),
      );
    }
    if (options.clientLayoutLoaders) {
      await writeFile(
        path.join(
          workspace,
          'provider/src/routes/__applications/layout.data.client.ts',
        ),
        "export const loader = () => ({ root: 'Root loader retained' })\n",
      );
      await writeFile(
        path.join(
          workspace,
          'provider/src/routes/__applications/product/layout.data.client.ts',
        ),
        "export const loader = () => ({ product: 'Product loader retained' })\n",
      );
      await writeFile(
        path.join(workspace, 'provider/src/routes/loading.tsx'),
        `
import { lazy } from 'react'
const Loading = lazy(() => import(/* webpackChunkName: "initial-loading" */ '../components/InitialLoading'))
export default function Fallback() { return <Loading /> }
`,
      );
      await writeFile(
        path.join(workspace, 'provider/src/components/InitialLoading.tsx'),
        'export default function Loading() { return <p>Loading station</p> }\n',
      );
    }
    if (options.documentBase !== undefined) {
      await writeFile(
        path.join(workspace, 'host/src/Document.tsx'),
        `
import { Html, Head, Body, Root } from '@modern-js/runtime/document'
export default function Document() {
  return <Html><Head><base href={${JSON.stringify(options.documentBase)}} /></Head><Body><Root /></Body></Html>
}
`,
      );
    }
    if (options.basename || options.hash) {
      const runtime = path.join(workspace, 'host/src/modern.runtime.tsx');
      const source = await readFile(runtime, 'utf8');
      await writeFile(
        runtime,
        source.replace(
          'plugins: [recoveryObserver()]',
          `router: { basename: ${JSON.stringify(options.basename || '/')}, supportHtml5History: ${!options.hash} }, plugins: [recoveryObserver()]`,
        ),
      );
    }
    if (options.hash) {
      if (options.service) {
        for (const name of ['service-ssr', 'service-csr'])
          await writeFile(
            path.join(workspace, name, 'src/modern.runtime.tsx'),
            "import { defineRuntimeConfig } from '@modern-js/runtime'\nexport default defineRuntimeConfig({ router: { supportHtml5History: false } })\n",
          );
      }
      await writeFile(
        path.join(workspace, 'provider/src/modern.runtime.tsx'),
        "import { defineRuntimeConfig } from '@modern-js/runtime'\nexport default defineRuntimeConfig({ router: { supportHtml5History: false } })\n",
      );
      const config = path.join(workspace, 'host/modern.config.ts');
      await writeFile(
        config,
        (await readFile(config, 'utf8')).replace(
          "ssr: { mode: 'stream', forceCSR: true }",
          'ssr: false',
        ),
      );
    }
    lab = await startLab(
      mode,
      false,
      workspace,
      options.basename || '',
      Boolean(options.service),
    );
    browser = await puppeteer.launch({
      headless: true,
      // Remove the profile with this Lab only after Chrome has closed.
      userDataDir: path.join(workspace, '.browser-profile'),
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
  beforeEach(async context => {
    context.onTestFailed(() => {
      console.error(`[MF lab failure] ${mode}: ${context.task.name}`);
      console.error(
        JSON.stringify({
          pendingRequests: [...pendingRequests],
          browserErrors,
          consoleErrors,
          pendingAges: [...requestStarts].map(([request, start]) => ({
            url: request.url(),
            age: Date.now() - start,
          })),
        }),
      );
      for (const [name, log] of lab.logs) console.error(`[${name}]\n${log}`);
    });
    page = await browser.newPage();
    browserErrors.length = 0;
    consoleErrors.length = 0;
    pendingRequests.clear();
    requestStarts.clear();
    slowRequests.length = 0;
    page.on('console', message => {
      if (message.type() === 'error')
        consoleErrors.push(message.text().slice(0, 1000));
    });
    page.on('request', request => {
      pendingRequests.add(request.url());
      requestStarts.set(request, Date.now());
    });
    page.on('requestfinished', request => {
      pendingRequests.delete(request.url());
      const duration = Date.now() - (requestStarts.get(request) ?? Date.now());
      if (duration > 2000)
        slowRequests.push({
          url: request.url(),
          duration,
          timing: request.response()?.timing(),
        });
      requestStarts.delete(request);
    });
    page.on('requestfailed', request => {
      pendingRequests.delete(request.url());
      requestStarts.delete(request);
      consoleErrors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    expectsRecovery = false;
    expectedErrors = undefined;
    expectedErrorGroups = undefined;
    page.on('pageerror', error => browserErrors.push(String(error)));
  });
  afterEach(async () => {
    await reportDiagnostics();
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
    await page.waitForSelector(`${selector(id)}:not(:disabled)`);
    await page.click(selector(id));
  }
  return () => ({
    lab,
    workspace,
    mode,
    page,
    browserErrors,
    consoleErrors,
    visit,
    text,
    click,
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
  options: {
    service?: boolean;
    basename?: string;
    hash?: boolean;
    documentBase?: string;
    clientLayoutLoaders?: boolean;
    conditionalClientRedirect?: boolean;
    initialRouteNoSSR?: boolean;
    applicationIsolation?: boolean;
    bridgeInputEvidence?: boolean;
    publicRoutesOnly?: boolean;
  } = {},
) {
  rstest.setConfig({ testTimeout: 60000, hookTimeout: 600000, retry: 0 });
  const modes = process.env.MF_LAB_MODE
    ? [process.env.MF_LAB_MODE as 'dev' | 'production']
    : (['dev', 'production'] as const);
  for (const mode of modes) {
    describe(`Weather Lab (${mode})`, () => {
      describe(name, () => register(setupLab(mode, options)));
    });
  }
}
