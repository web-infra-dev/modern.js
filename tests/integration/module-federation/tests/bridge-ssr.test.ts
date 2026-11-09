import { describeLab } from './fixture';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Existing Modern SSRLiveReload emits a script during client-only mounting.
// Also reproducible on the unchanged /route-exports?csr=1 in development.
// Do not suppress other console errors or any recoverable hydration error.
function expectConsole(errors: string[], mode: string) {
  expect(errors).toEqual(
    mode === 'dev'
      ? [
          'Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).',
        ]
      : [],
  );
}

function bridgeFrames(html: string) {
  return [
    ...html.matchAll(
      /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
    ),
  ].map(
    match => JSON.parse(match[1]) as [string, { type: string; html?: string }],
  );
}

const inputs = [
  {
    source: 'string',
    name: 'CurrentWeather',
    route: 'current',
    content: 'Mostly sunny',
  },
  {
    source: 'loader',
    name: 'WeatherForecast',
    route: 'forecast',
    content: 'Your next five days',
  },
  {
    source: 'preloaded',
    name: 'AirQuality',
    route: 'air',
    content: 'Fresh air, open windows',
  },
] as const;

// Each registration owns startLab + a temporary workspace, not just a fresh
// browser context. Neither API can inherit the other's Node MF module cache.
for (const api of ['factory', 'declarative']) {
  describeLab(
    `Weather Bridge ${api}`,
    getContext => {
      it('first resolves distinct exports in a fresh service process, with compiled dependency evidence', async () => {
        const { lab, workspace } = getContext();
        const evaluations = () =>
          [
            ...(lab.logs.get('host-v1') || '').matchAll(
              /\[BRIDGE_EVALUATED:(export|page):(\w+)\]/g,
            ),
          ].map(match => `${match[1]}:${match[2]}`);
        expect(evaluations()).not.toContain('export:CurrentWeather');
        expect(evaluations()).not.toContain('export:WeatherForecast');
        const get = async (only: string) => {
          const response = await fetch(
            `${lab.url}/bridge-inputs?api=${api}&only=${only}`,
          );
          expect(response.status).toBe(200);
          const body = await response.text();
          const frames = bridgeFrames(body);
          expect(frames.some(([, frame]) => frame.type === 'error')).toBe(
            false,
          );
          expect(body).not.toContain('BRIDGE_NO_SSR_LOADER_CALLED');
          return frames;
        };
        expect(await get('none')).toEqual([]);
        expect(evaluations()).toEqual(['export:AirQuality']);
        expect(lab.weatherRequests).toEqual([]);
        for (const source of ['preloaded', 'string', 'loader']) {
          const input = inputs.find(input => input.source === source)!;
          const before = evaluations();
          if (source !== 'preloaded') {
            expect(before).not.toContain(`export:${input.name}`);
          }
          expect(before).not.toContain(`page:${input.name}`);
          const frames = await get(source);
          const html = frames
            .filter(([, frame]) => frame.type === 'html')
            .map(([, frame]) => frame.html)
            .join('');
          expect(html).toContain(input.content);
          expect(html).toContain(`data-testid="weather-${input.route}"`);
          expect(html).toContain('10:30 CST');
          expect(html).not.toContain('data-testid="scope-root"');
          expect(html).not.toContain('Root loader retained');
          for (const other of inputs.filter(other => other !== input)) {
            expect(html).not.toContain(`data-testid="weather-${other.route}"`);
          }
          expect(
            frames.filter(([, frame]) => frame.type === 'ready'),
          ).toHaveLength(1);
          expect(
            frames.filter(([, frame]) => frame.type === 'done'),
          ).toHaveLength(1);
          expect(frames.some(([, frame]) => frame.type === 'data')).toBe(false);
          expect(
            evaluations().filter(item => item === `export:${input.name}`),
          ).toHaveLength(1);
          expect(
            evaluations().filter(item => item === `page:${input.name}`),
          ).toHaveLength(1);
          if (source !== 'loader') {
            expect(evaluations()).not.toContain('export:WeatherForecast');
            expect(evaluations()).not.toContain('page:WeatherForecast');
          }
        }
        expect(lab.weatherRequests).toEqual(['air', 'current', 'forecast']);
        const browserGraphs = (await (
          await fetch(
            `http://localhost:${lab.ports.provider}/static/route-scope-graph.json`,
          )
        ).json()) as Record<string, string[]>;
        const serverGraphs = JSON.parse(
          await readFile(
            path.join(
              workspace,
              'provider/dist/bundles/static/route-scope-graph.json',
            ),
            'utf8',
          ),
        ) as Record<string, string[]>;
        for (const graphs of [browserGraphs, serverGraphs])
          for (const input of inputs) {
            const graph = graphs[input.name].join('\n').replaceAll('\\', '/');
            expect(graph).toContain(
              `/src/routes/weather/${input.route}/page.tsx`,
            );
            expect(graph).not.toContain('/src/routes/__applications/');
            for (const other of inputs.filter(other => other !== input)) {
              expect(graph).not.toContain(
                `/src/routes/weather/${other.route}/page.tsx`,
              );
              expect(graph).not.toContain(`/src/exports/${other.name}App.tsx`);
            }
          }
        const browserHost = (await (
          await fetch(`${lab.url}/static/bridge-input-graph.json`)
        ).json()) as {
          roots: string[];
          reachable: string[];
          remotes: { id: string; issuers: string[] }[];
        };
        const serverHost = JSON.parse(
          await readFile(
            path.join(
              workspace,
              'host/dist/bundles/static/bridge-input-graph.json',
            ),
            'utf8',
          ),
        ) as typeof browserHost;
        for (const host of [browserHost, serverHost]) {
          expect(host.roots).toHaveLength(1);
          expect(host.reachable.join('\n')).toContain('AirQualityApp');
          expect(host.reachable.join('\n')).not.toContain('CurrentWeatherApp');
          expect(host.reachable.join('\n')).not.toContain('WeatherForecastApp');
          // All host entries/barrels are considered, not only the demo page.
          expect(
            host.remotes.some(remote =>
              /CurrentWeatherApp|WeatherForecastApp/.test(remote.id),
            ),
          ).toBe(false);
          expect(
            host.remotes.some(remote => remote.id.includes('AirQualityApp')),
          ).toBe(true);
        }
      });

      it('returns three weather applications and SSR frames, while noSSR stays client-only', async () => {
        const { lab } = getContext();
        const body = await (
          await fetch(`${lab.url}/bridge-inputs?api=${api}`)
        ).text();
        const frames = bridgeFrames(body);
        const html = frames
          .filter(([, frame]) => frame.type === 'html')
          .map(([, frame]) => frame.html)
          .join('');
        for (const input of inputs) expect(html).toContain(input.content);
        expect(
          frames.filter(([, frame]) => frame.type === 'done'),
        ).toHaveLength(3);
        expect(
          frames.filter(([, frame]) => frame.type === 'ready'),
        ).toHaveLength(3);
        expect(frames.some(([, frame]) => frame.type === 'error')).toBe(false);
        expect(body).toContain('bridge-client-placeholder');
        expect(html).not.toContain('Travel air quality');
        expect(body).not.toContain('BRIDGE_NO_SSR_LOADER_CALLED');
      });

      it('keeps visible server DOM, restored data, Root, Router and state through hydration and props updates', async () => {
        const { lab, page, consoleErrors, mode } = getContext();
        const start = lab.weatherRequests.length;
        const browserLoaders: string[] = [];
        page.on('request', request => {
          if (new URL(request.url()).searchParams.has('__loader'))
            browserLoaders.push(request.url());
        });
        let release!: () => void;
        const gate = new Promise<void>(resolve => {
          release = resolve;
        });
        await page.setRequestInterception(true);
        page.on('request', async request => {
          if (
            /^\/static\/js\/index(?:\.[\w]+)?\.js$/.test(
              new URL(request.url()).pathname,
            )
          )
            await gate;
          if (!request.isInterceptResolutionHandled()) await request.continue();
        });
        const navigation = page.goto(`${lab.url}/bridge-inputs?api=${api}`, {
          waitUntil: 'domcontentloaded',
        });
        const roots =
          '[data-testid^="bridge-input-"] [data-testid="weather-root"]';
        const serverElements = [
          roots,
          ...inputs.map(
            input =>
              `[data-testid="bridge-input-${input.source}"] [data-testid="weather-${input.route}"]`,
          ),
        ].join(', ');
        try {
          await page.waitForFunction(() =>
            ['current', 'forecast', 'air'].every(kind =>
              document.querySelector(`[data-testid="weather-${kind}"]`),
            ),
          );
          expect(
            await page.evaluate(
              () => document.documentElement.dataset.bridgeHostReady,
            ),
          ).toBeUndefined();
          expect(
            await page.evaluate(
              () => (window as any).__bridgeEvaluations || [],
            ),
          ).toEqual([]);
          expect(
            await page.$$eval(`${roots} [data-testid="weather-save"]`, nodes =>
              nodes.every(node => (node as HTMLButtonElement).disabled),
            ),
          ).toBe(true);
          expect(
            await page.$(
              '[data-testid="bridge-client-only"] [data-testid="weather-air"]',
            ),
          ).toBeNull();
          await page.evaluate(selector => {
            (window as any).__bridgeServerNodes = [
              ...document.querySelectorAll(selector),
            ];
          }, serverElements);
          expect(
            await page.$eval(
              '[data-testid="weather-current"]',
              node => node.getBoundingClientRect().height > 0,
            ),
          ).toBe(true);
          expect(lab.weatherRequests.slice(start).sort()).toEqual([
            'air',
            'current',
            'forecast',
          ]);
          release();
          await navigation;
          await page.waitForSelector('html[data-bridge-host-ready="true"]');
          await page.waitForFunction(
            selector =>
              [...document.querySelectorAll(selector)].every(
                node => (node as HTMLElement).dataset.ready === 'true',
              ),
            {},
            roots,
          );
          await page.waitForSelector(
            '[data-testid="bridge-client-only"] [data-testid="weather-air"]',
          );
          expect(
            await page.evaluate(() =>
              (window as any).__bridgeEvaluations.slice().sort(),
            ),
          ).toEqual(
            inputs
              .flatMap(input => [`export:${input.name}`, `page:${input.name}`])
              .sort(),
          );
          // Three server requests plus only the deliberately client-only mount.
          expect(lab.weatherRequests.slice(start).sort()).toEqual([
            'air',
            'air',
            'current',
            'forecast',
          ]);
          expect(browserLoaders).toHaveLength(1);
          const current = '[data-testid="bridge-input-string"]';
          const forecast = '[data-testid="bridge-input-loader"]';
          await page.click(`${current} [data-testid="weather-save"]`);
          await page.click(`${current} [data-testid="weather-unit"]`);
          await page.click(`${forecast} [data-testid="weather-day-2"]`);
          await page.waitForFunction(() =>
            document
              .querySelector('[data-testid="weather-day-detail"]')
              ?.textContent?.includes('Wed · Light rain'),
          );
          const hostUrl = page.url();
          await page.click('[data-testid="bridge-rename"]');
          await page.waitForFunction(
            selector =>
              [
                ...document.querySelectorAll(
                  `${selector} [data-testid="weather-location"]`,
                ),
              ].every(node => node.textContent?.includes('West Lake')),
            {},
            roots,
          );
          expect(
            await page.$eval(`${current} [data-testid="weather-save"]`, node =>
              node.getAttribute('aria-pressed'),
            ),
          ).toBe('true');
          expect(
            await page.$eval(`${current} [data-testid="weather-unit"]`, node =>
              node.getAttribute('aria-pressed'),
            ),
          ).toBe('true');
          expect(
            await page.$eval(
              `${forecast} [data-testid="weather-day-2"]`,
              node => node.getAttribute('aria-pressed'),
            ),
          ).toBe('true');
          expect(page.url()).toBe(hostUrl);
          expect(
            await page.evaluate(
              selector =>
                (window as any).__bridgeServerNodes.every(
                  (node: Element, index: number) =>
                    node === document.querySelectorAll(selector)[index],
                ),
              serverElements,
            ),
          ).toBe(true);
          expect(new URL(page.url()).searchParams.has('csr')).toBe(false);
          expectConsole(consoleErrors, mode);
        } finally {
          release();
          await navigation;
        }
      });

      it('isolates repeated mounts and destroys state only for disconnected panels', async () => {
        const { lab, page, consoleErrors, mode } = getContext();
        await page.goto(`${lab.url}/bridge-inputs?api=${api}`, {
          waitUntil: 'networkidle0',
        });
        await page.click('.weather-board-info summary');
        const primary = '[data-testid="bridge-input-preloaded"]';
        const travel = '[data-testid="bridge-client-only"]';
        await page.waitForSelector(`${travel} [data-ready="true"]`);
        await page.click(`${primary} [data-testid="weather-save"]`);
        await page.click(`${primary} [data-testid="weather-air-details"]`);
        expect(
          await page.$(`${travel} [data-testid="weather-pollutants"]`),
        ).toBeNull();
        expect(
          await page.$eval(`${travel} [data-testid="weather-save"]`, node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('false');
        await page.click(`${travel} [data-testid="weather-save"]`);
        await page.evaluate(() => {
          (window as any).__travelNode = document.querySelector(
            '[data-testid="bridge-client-only"] [data-testid="weather-root"]',
          );
          (window as any).__primaryNode = document.querySelector(
            '[data-testid="bridge-input-preloaded"] [data-testid="weather-root"]',
          );
        });
        await page.click('[data-testid="bridge-toggle"]');
        await page.waitForFunction(
          () =>
            !document.querySelector(
              '[data-testid="bridge-input-preloaded"] [data-testid="weather-root"]',
            ),
        );
        await page.click('[data-testid="bridge-toggle"]');
        await page.waitForSelector(`${primary} [data-ready="true"]`);
        expect(
          await page.$eval(`${primary} [data-testid="weather-save"]`, node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('false');
        expect(
          await page.$(`${primary} [data-testid="weather-pollutants"]`),
        ).toBeNull();
        expect(
          await page.$eval(`${travel} [data-testid="weather-save"]`, node =>
            node.getAttribute('aria-pressed'),
          ),
        ).toBe('true');
        expect(
          await page.evaluate(
            () =>
              (window as any).__travelNode ===
              document.querySelector(
                '[data-testid="bridge-client-only"] [data-testid="weather-root"]',
              ),
          ),
        ).toBe(true);
        expect(
          await page.evaluate(() => (window as any).__primaryNode.isConnected),
        ).toBe(false);
        expectConsole(consoleErrors, mode);
      });

      it('keeps the input contract fixture usable on mobile screens', async () => {
        const { lab, page } = getContext();
        await page.setViewport({ width: 390, height: 844 });
        await page.goto(`${lab.url}/bridge-inputs`, {
          waitUntil: 'networkidle0',
        });
        await page.waitForSelector('[data-testid="weather-current"]');
        expect(await page.$eval('h1', node => node.textContent)).toBe(
          'Look up. Slow down.',
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await page.$eval('.bulletin-temperature', node =>
            Number.parseFloat(getComputedStyle(node).fontSize),
          ),
        ).toBeGreaterThanOrEqual(64);
      });
    },
    { bridgeInputEvidence: true },
  );
}
