import type { ChildProcess } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

type RouteAssets = Record<string, { referenceCssAssets?: string[] }>;

const getStylesheets = (html: string) => {
  const head = html.slice(0, html.indexOf('</head>'));
  return (head.match(/<link\b[^>]*>/g) ?? [])
    .filter(tag => /\brel="stylesheet"/.test(tag))
    .map(tag => /\bhref="([^"]+)"/.exec(tag)?.[1])
    .filter((href): href is string => Boolean(href));
};

const writeConfig = (appDir: string, output: string) =>
  writeFile(
    path.join(appDir, 'modern.config.ts'),
    `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: true },
  output: ${output},
  performance: { prefetch: true },
});`,
  );

describe.each([
  ['default', '{}'],
  ['descendants', `{ routeCssScope: 'descendants' }`],
  ['direct', `{ routeCssScope: 'direct' }`],
] as const)('route css scope (%s)', (scope, output) => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let port: number;
  let routeAssets: RouteAssets;

  /** Class names contained in the stylesheets the shell links to. */
  const getShellClassNames = async (pathname: string) => {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
    expect(response.status).toBe(200);
    const html = await response.text();
    const classNames = new Set<string>();
    for (const href of getStylesheets(html)) {
      const css = await (
        await fetch(new URL(href, `http://127.0.0.1:${port}`))
      ).text();
      for (const [, name] of css.matchAll(/\.([\w-]+)\s*\{/g)) {
        classNames.add(name);
      }
    }
    return { html, classNames };
  };

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    await writeConfig(fixture.appDir, output);
    port = await getPort();
    const result = await modernBuild(fixture.appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    app = await modernServe(fixture.appDir, port);
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

  test('always injects the CSS of the matched route itself', async () => {
    const { html, classNames } = await getShellClassNames('/css-scope');
    expect(html).toContain('Shown component');
    expect(classNames.has('css-scope-page')).toBe(true);
  });

  if (scope === 'direct') {
    test('does not inject the CSS of lazy descendants', async () => {
      const { classNames } = await getShellClassNames('/css-scope');
      // Rendered by SSR inside Suspense: loaded with its chunk on the client.
      expect(classNames.has('css-scope-shown')).toBe(false);
      // Imported only after a click, and the chunk it imports in turn.
      expect(classNames.has('css-scope-dialog')).toBe(false);
      expect(classNames.has('css-scope-deep')).toBe(false);
    });

    test('route manifest only records the CSS of the route chunk group', () => {
      const pageCss = routeAssets['css-scope/page'].referenceCssAssets ?? [];
      expect(pageCss).toHaveLength(1);
      expect(pageCss[0]).toMatch(/async\/css-scope\/page\.[\w]+\.css$/);
    });
  } else {
    // #8677: CSS of `React.lazy` descendants is injected into the shell to
    // avoid a flash of unstyled content, including chunks SSR does not render.
    test('injects the CSS of every lazy descendant', async () => {
      const { classNames } = await getShellClassNames('/css-scope');
      expect(classNames.has('css-scope-shown')).toBe(true);
      expect(classNames.has('css-scope-dialog')).toBe(true);
      expect(classNames.has('css-scope-deep')).toBe(true);
    });

    test('keeps the #8677 lazy route behavior', async () => {
      const { html, classNames } = await getShellClassNames('/lazy');
      expect(html).toContain('Lazy Component');
      expect(classNames.has('color')).toBe(true);
      expect(classNames.has('lazy')).toBe(true);
    });
  }
});
