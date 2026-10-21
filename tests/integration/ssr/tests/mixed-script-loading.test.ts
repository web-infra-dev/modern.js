import type { ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

type OrderState = {
  sdkReady?: boolean;
  business?: { sdkReady: boolean };
  dcl: boolean;
  businessDcl: number;
};
type OrderWindow = Window & { __scriptOrder: OrderState };

// Cover both HTML implementations and runtime embedded in the entry itself.
describe.each([
  ['native', true],
  ['native', false],
  ['js', true],
  ['js', false],
] as const)(
  'mixed SSR scripts (%s, separate runtime: %s)',
  (implementation, separateRuntime) => {
    let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
    let app: ChildProcess | undefined;
    let browser: Browser | undefined;
    let origin: string;

    beforeAll(async () => {
      fixture = await createIsolatedTestApp(
        path.resolve(__dirname, '../fixtures/streaming'),
        { exclude: ['src'] },
      );
      await writeFile(
        path.join(fixture.appDir, 'modern.config.ts'),
        `
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  source: {
    disableDefaultEntries: true,
    preEntry: ['./src/probe.ts'],
    entries: {
      csr: './src/csr/routes',
      string: './src/string/routes',
      stream: './src/stream/routes',
    },
  },
  server: {
    ssr: true,
    ssrByEntries: {
      csr: false,
      string: { mode: 'string' },
    },
  },
  html: {
    inject: 'body',
    template: './template.html',
  },
  builderPlugins: [
    {
      name: 'test-html-implementation',
      setup(api) {
        api.modifyRsbuildConfig(config => {
          config.html = {
            ...config.html,
            implementation: '${implementation}',
          };
        });
      },
    },
  ],
  tools: {
    // Native HTML accepts a boolean, not Modern's JS minifier callback.
    ...(${implementation === 'native'} ? { htmlPlugin: { minify: false } } : {}),
    rspack(config, { isServer }) {
      if (!isServer && !${separateRuntime}) {
        config.optimization.runtimeChunk = false;
      }
    },
  },
});`,
      );
      await writeFile(
        path.join(fixture.appDir, 'template.html'),
        '<!doctype html><html><head><script defer src="/order-sdk.js"></script></head><body><div id="root"><!--<?- html ?>--></div><!--<?- chunksMap.js ?>--><!--<?- SSRDataScript ?>--><!--<?- bottomTemplate ?>--></body></html>',
      );
      for (const entry of ['csr', 'string', 'stream']) {
        const dir = path.join(fixture.appDir, 'src', entry, 'routes');
        await mkdir(dir, { recursive: true });
        await writeFile(
          path.join(dir, 'layout.tsx'),
          "import { Outlet } from '@modern-js/runtime/router'; export default function Layout() { return <Outlet />; }",
        );
        await writeFile(
          path.join(dir, 'page.tsx'),
          `
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return <button id="counter" onClick={() => setCount(count + 1)}>count:{count}</button>;
}`,
        );
      }
      await writeFile(
        path.join(fixture.appDir, 'src/probe.ts'),
        `if (typeof window !== 'undefined') {
  const state = (window as Window & { __scriptOrder: { sdkReady?: boolean; business?: { sdkReady: boolean }; businessDcl: number } }).__scriptOrder;
  if (state) {
    state.business = { sdkReady: state.sdkReady === true };
    document.addEventListener('DOMContentLoaded', () => { state.businessDcl++; });
  }
}`,
      );
      const result = await modernBuild(fixture.appDir);
      expect(result.code, `${result.stdout}\n${result.stderr}`).toBe(0);
      const port = await getPort();
      origin = `http://127.0.0.1:${port}`;
      app = await modernServe(fixture.appDir, port);
      browser = await puppeteer.launch({ ...launchOptions, headless: true });
    }, 120000);

    afterAll(async () => {
      try {
        await browser?.close();
      } finally {
        try {
          if (app) await killApp(app);
        } finally {
          await fixture?.cleanup();
        }
      }
    });

    it.each(['csr', 'string', 'stream'])(
      'keeps the %s entry script in its own rendering layout',
      async entry => {
        const response = await fetch(`${origin}/${entry}`, {
          headers: { 'user-agent': 'Mozilla/5.0' },
        });
        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html.includes('id="counter"')).toBe(entry !== 'csr');
        const scripts = [
          ...html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g),
        ].filter(match => match[1].startsWith('/static/'));
        expect(scripts.length).toBeGreaterThan(0);
        for (const script of scripts) {
          const isRuntime =
            /\/builder-runtime(?:\.|\.js)/.test(script[1]) ||
            (!separateRuntime && /\/stream\./.test(script[1]));
          if (entry === 'stream') {
            expect(script[0]).toMatch(/\sasync(?:[\s=>])/);
            expect(script[0]).not.toMatch(/\sdefer(?:[\s=>])/);
            if (!isRuntime)
              expect(script.index).toBeLessThan(html.indexOf('</head>'));
          } else {
            expect(script[0]).toMatch(/\sdefer(?:[\s=>])/);
            expect(script[0]).not.toMatch(/\sasync(?:[\s=>])/);
            expect(script.index).toBeGreaterThan(html.indexOf('<body>'));
          }
        }
        if (!separateRuntime && entry !== 'stream') {
          expect(html).not.toMatch(
            /<link[^>]+rel="(?:module)?preload"[^>]+(?:csr|string)\./,
          );
        }
      },
    );

    it.each([
      ['csr', 'entry'],
      ['csr', 'sdk'],
      ['string', 'entry'],
      ['string', 'sdk'],
    ] as const)(
      'preserves SDK order and DOMContentLoaded for %s with a held %s script',
      async (entry, heldScript) => {
        const page = await browser!.newPage();
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        let release: () => void = () => {};
        const gate = new Promise<void>(resolve => {
          release = resolve;
        });
        let notifyHeld: () => void = () => {};
        const held = new Promise<void>(resolve => {
          notifyHeld = resolve;
        });
        let navigation: Promise<unknown> | undefined;
        try {
          await page.evaluateOnNewDocument(() => {
            const state: OrderState = { dcl: false, businessDcl: 0 };
            (window as OrderWindow).__scriptOrder = state;
            document.addEventListener('DOMContentLoaded', () => {
              state.dcl = true;
            });
          });
          await page.setRequestInterception(true);
          page.on('request', async request => {
            const pathname = new URL(request.url()).pathname;
            const isSdk = pathname === '/order-sdk.js';
            const isHeld =
              heldScript === 'sdk'
                ? isSdk
                : pathname.startsWith(`/static/js/${entry}.`);
            if (isHeld) {
              notifyHeld();
              await gate;
            }
            if (isSdk) {
              await request.respond({
                contentType: 'application/javascript',
                body: 'window.__scriptOrder.sdkReady = true;',
              });
            } else {
              await request.continue();
            }
          });
          navigation = page.goto(`${origin}/${entry}`, { waitUntil: 'load' });
          await Promise.race([
            held,
            navigation.then(() => {
              throw new Error('Expected to hold a script request');
            }),
          ]);
          // Finish every other request while the selected script is still held.
          await page.waitForNetworkIdle({ concurrency: 1, idleTime: 200 });
          const before = await page.evaluate(
            () => (window as OrderWindow).__scriptOrder,
          );
          expect(before.business).toBeUndefined();
          expect(before.dcl).toBe(false);
          release();
          await navigation;
          await page.waitForSelector('#counter');
          await page.click('#counter');
          await page.waitForFunction(
            () => document.querySelector('#counter')?.textContent === 'count:1',
          );
          const after = await page.evaluate(
            () => (window as OrderWindow).__scriptOrder,
          );
          expect(after.business).toEqual({ sdkReady: true });
          expect(after.dcl).toBe(true);
          expect(after.businessDcl).toBe(1);
          expect(errors).toEqual([]);
        } finally {
          release();
          await navigation?.catch(() => {});
          await page.close();
        }
      },
    );
  },
);
