import path, { join } from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

type RouteManifest = {
  routeAssets: Record<
    string,
    { assets?: string[]; referenceCssAssets?: string[] }
  >;
};

function parseRouteManifest(html: string): RouteManifest {
  const marker = 'window._MODERNJS_ROUTE_MANIFEST';
  const at = html.indexOf(marker);
  const start = at === -1 ? -1 : html.indexOf('{', at);
  if (start === -1) {
    throw new Error('route manifest not found in HTML');
  }
  // Extract the balanced JSON object starting at `start`.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(html.slice(start, i + 1));
      }
    }
  }
  throw new Error('route manifest object not balanced');
}

// Verifies the stream SSR + lazy compilation route-eager path on a dedicated
// fixture (`streaming-lazy`, lazy always on) so it never shares dist with the
// baseline `streaming` fixture. Route component chunks must still compile
// eagerly, so first-screen async route assets (JS + CSS) are emitted, recorded
// in the route manifest, and injected.
describe('Streaming SSR with lazy compilation', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'streaming-lazy');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('first-screen async route JS/CSS assets are restored under lazy', async () => {
    const res = await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: 'networkidle0',
    });
    const body = await res!.text();

    // Page renders correctly, including the deeply-nested static child:
    // page.tsx -> (static) About.tsx -> (static) B.tsx.
    expect(body).toMatch(/<div>About content<\/div>/);
    expect(body).toMatch(/<div>B content<\/div>/);
    // CSS link injected into first-screen HTML.
    expect(body).toMatch(
      /<link href="\/static\/css\/async\/about\/page.css" rel="stylesheet" \/>/,
    );

    // Route manifest assets are fully recovered (not deferred away by lazy).
    const manifest = parseRouteManifest(body);
    const about = manifest.routeAssets['about/page'];
    expect(about).toBeDefined();
    expect(about.assets?.some(a => /async\/about\/page\.js$/.test(a))).toBe(
      true,
    );
    expect(
      about.referenceCssAssets?.some(a => /async\/about\/page\.css$/.test(a)),
    ).toBe(true);

    // Forcing the route component eager pulls its whole STATIC import subgraph
    // (About + B) into the route chunk, so every nested component's CSS is
    // merged into the single route CSS file — not just the route file's own.
    // Fetch that CSS and assert both the 2nd-level (.about) and the
    // 3rd-level (.b-deep) styles are present.
    const cssRes = await page.goto(
      `http://localhost:${appPort}/static/css/async/about/page.css`,
    );
    const css = await cssRes!.text();
    expect(css).toMatch(/\.about\b/);
    expect(css).toMatch(/\.b-deep\b/);
  });
});
