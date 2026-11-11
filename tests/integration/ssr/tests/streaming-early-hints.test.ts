import type { ChildProcess } from 'node:child_process';
import http from 'node:http';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

type RouteAssets = Record<
  string,
  { assets?: string[]; referenceCssAssets?: string[] }
>;

type Result = {
  /** Status codes in the order they arrived, 1xx included. */
  statuses: number[];
  earlyHintLinks: string[];
  html: string;
};

/** Node's HTTP client exposes 1xx responses through the `information` event. */
const request = (port: number, pathname: string) =>
  new Promise<Result>((resolve, reject) => {
    const statuses: number[] = [];
    const earlyHintLinks: string[] = [];
    const req = http.get({ host: '127.0.0.1', port, path: pathname }, res => {
      statuses.push(res.statusCode!);
      let html = '';
      res.setEncoding('utf-8');
      res.on('data', chunk => {
        html += chunk;
      });
      res.on('end', () => resolve({ statuses, earlyHintLinks, html }));
    });
    req.on('information', info => {
      statuses.push(info.statusCode);
      if (info.statusCode === 103) {
        const link = info.headers.link;
        earlyHintLinks.push(
          ...(Array.isArray(link) ? link : (link ?? '').split(/,\s*(?=<)/)),
        );
      }
    });
    req.on('error', reject);
  });

const getHrefs = (links: string[]) =>
  links.map(link => /^<([^>]+)>/.exec(link)?.[1]);

const writeConfig = (appDir: string, ssr: string) =>
  writeFile(
    path.join(appDir, 'modern.config.ts'),
    `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: ${ssr} },
  performance: { prefetch: true },
});`,
  );

describe.each([
  ['production', 'true'],
  ['production', `{ earlyHints: true }`],
  ['production', `{ earlyHints: true, mode: 'string' }`],
  ['development', `{ earlyHints: true }`],
] as const)('early hints (%s, ssr: %s)', (mode, ssr) => {
  const enabled = ssr.includes('earlyHints: true');
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let port: number;
  let routeAssets: RouteAssets;

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    await writeConfig(fixture.appDir, ssr);
    if (ssr.includes('string')) {
      // The fixture's custom server entry always calls `renderStreaming`.
      await rm(path.join(fixture.appDir, 'src/entry.server.tsx'));
    }
    port = await getPort();
    if (mode === 'production') {
      const result = await modernBuild(fixture.appDir);
      expect(result.code, result.stderr || result.stdout).toBe(0);
      app = await modernServe(fixture.appDir, port);
    } else {
      app = await launchApp(fixture.appDir, port);
    }
    // Make sure the dev server has compiled the page before reading the
    // route manifest.
    await request(port, '/user/1');
    routeAssets = JSON.parse(
      await readFile(
        path.join(fixture.appDir, 'dist/routes-manifest.json'),
        'utf-8',
      ),
    ).routeAssets;
  });

  afterAll(async () => {
    try {
      if (app) await killApp(app);
    } finally {
      await fixture?.cleanup();
    }
  });

  if (!enabled) {
    test('does not send 103 by default', async () => {
      const { statuses, html } = await request(port, '/user/1');
      expect(statuses).toEqual([200]);
      expect(html).toContain('User layout');
    });
    return;
  }

  test('sends 103 with Link headers before the final response', async () => {
    const { statuses, earlyHintLinks, html } = await request(port, '/user/1');
    expect(statuses).toEqual([103, 200]);
    expect(html).toContain('User layout');

    const hrefs = getHrefs(earlyHintLinks);
    // The entry scripts of the HTML.
    const entryScripts = [
      ...html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g),
    ]
      .map(match => match[1])
      .filter(src => !src.includes('/async/'));
    expect(entryScripts.length).toBeGreaterThan(0);
    for (const src of entryScripts) {
      expect(hrefs, src).toContain(src);
    }
    // The JS chunks of the matched nested routes.
    for (const id of ['user/layout', 'user/(id)/page']) {
      const routeJs = routeAssets[id].assets?.find(
        asset => asset.endsWith('.js') && asset.includes(`/async/${id}`),
      );
      expect(routeJs, id).toBeDefined();
      expect(hrefs, id).toContain(routeJs);
    }
    // Routes that are not matched are not hinted.
    expect(hrefs.some(href => href?.includes('/async/about/'))).toBe(false);
    for (const link of earlyHintLinks) {
      expect(link).toMatch(/^<[^>]+>; rel=preload; as=(script|style)/);
    }
  });

  if (!ssr.includes('string')) {
    test('a loader redirect still sets the final status', async () => {
      const { statuses } = await request(port, '/redirect');
      expect(statuses[0]).toBe(103);
      expect(statuses[statuses.length - 1]).toBe(302);
    });
  }
});
