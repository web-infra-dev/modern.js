import type { ChildProcess } from 'node:child_process';
import http from 'node:http';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures/streaming');

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

const writeApp = async (appDir: string, enabled: boolean, ssr: string) => {
  await writeFile(
    path.join(appDir, 'modern.config.ts'),
    `import { applyBaseConfig } from '../../../../utils/applyBaseConfig';
export default applyBaseConfig({
  server: { ssr: ${ssr} },
  performance: { resourceStages: { routes: false${enabled ? ', earlyHints: true' : ''} } },
});`,
  );

  // The same declaration serves both requests, including the loader redirect.
  const layout = path.join(appDir, 'src/routes/layout.tsx');
  await writeFile(
    layout,
    `import { stagedImport } from '@modern-js/runtime/resources';
const critical = stagedImport.critical(() => import('./early-critical'));
const later = stagedImport.idle(() => import('./early-idle'));
export { critical, later };
` + (await readFile(layout, 'utf8')),
  );
  for (const name of ['critical', 'idle']) {
    await writeFile(
      path.join(appDir, `src/routes/early-${name}.ts`),
      `export default '${name}';`,
    );
  }
};

describe.each([
  [false, 'true'],
  [true, 'true'],
  [true, "{ mode: 'string' }"],
] as const)('staged Early Hints (enabled: %s, SSR: %s)', (enabled, ssr) => {
  let fixture: Awaited<ReturnType<typeof createIsolatedTestApp>>;
  let app: ChildProcess | undefined;
  let port: number;
  let criticalFiles: string[];
  let idleFiles: string[];

  beforeAll(async () => {
    fixture = await createIsolatedTestApp(fixtureDir);
    await writeApp(fixture.appDir, enabled, ssr);
    if (ssr.includes('string')) {
      await rm(path.join(fixture.appDir, 'src/entry.server.tsx'));
    }
    port = await getPort();
    const result = await modernBuild(fixture.appDir);
    expect(result.code, result.stderr || result.stdout).toBe(0);
    app = await modernServe(fixture.appDir, port);
    const { declarations } = JSON.parse(
      await readFile(
        path.join(fixture.appDir, 'dist/resource-stages.json'),
        'utf8',
      ),
    ) as {
      declarations: {
        stage: string;
        chunks: { files: string[] }[];
      }[];
    };
    const filesFor = (stage: string) =>
      declarations
        .find(item => item.stage === stage)
        ?.chunks.flatMap(chunk => chunk.files) ?? [];
    criticalFiles = filesFor('critical');
    idleFiles = filesFor('idle');
  });

  afterAll(async () => {
    try {
      if (app) await killApp(app);
    } finally {
      await fixture?.cleanup();
    }
  });

  test('uses the HTML preload plan and keeps it in the final response', async () => {
    const { statuses, earlyHintLinks, html } = await request(port, '/user/1');
    expect(statuses).toEqual(enabled ? [103, 200] : [200]);
    expect(html).toContain('User layout');
    expect(criticalFiles.length).toBeGreaterThan(0);
    expect(idleFiles.length).toBeGreaterThan(0);
    const htmlPreloads = [
      ...html.matchAll(/<link\b[^>]*rel="preload"[^>]*href="([^"]+)"/g),
    ].map(match => match[1]);
    expect(htmlPreloads).toEqual(expect.arrayContaining(criticalFiles));
    expect(getHrefs(earlyHintLinks)).toEqual(enabled ? criticalFiles : []);
  });

  if (enabled && !ssr.includes('string')) {
    test('keeps the final loader redirect after 103', async () => {
      const { statuses } = await request(port, '/redirect');
      expect(statuses).toEqual([103, 302]);
    });
  }
});
