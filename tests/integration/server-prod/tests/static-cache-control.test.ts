import path from 'path';
import { execa, fs as fse } from '@modern-js/utils';
import {
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
  runContinuousTask,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 3 });

const appDir = path.resolve(__dirname, '../');
// Built into its own directory, so it can run in parallel with the other
// test files of this app.
const TEST_DIST = 'dist-static-cache-control';
const distDir = path.join(appDir, TEST_DIST);

const HASHED_DEFAULT = 'public, max-age=31536000, immutable';
const UNHASHED_DEFAULT = 'no-cache';
const ETAG_REGEX = /^W\/"([0-9a-f]+)-[\w-]{22}"$/;

type StaticFile = {
  name: string;
  url: string;
  // Path of the served file in the build output.
  file: string;
  hashed: boolean;
};

let staticFiles: StaticFile[] = [];

const findHashedAsset = async (dir: string, extension: string) => {
  const name = (await fse.readdir(path.join(distDir, dir))).find(file =>
    new RegExp(`\\.[0-9a-f]{8,}\\.${extension}$`).test(file),
  );
  if (!name) {
    throw new Error(`No hashed .${extension} file in ${TEST_DIST}/${dir}`);
  }
  return `${dir}/${name}`;
};

const unhashedFiles: Omit<StaticFile, 'hashed'>[] = [
  { name: 'config/public file', url: '/robots.txt', file: 'public/robots.txt' },
  {
    name: 'config/public file with a hash-like name',
    url: '/notes.0123456789ab.txt',
    file: 'public/notes.0123456789ab.txt',
  },
  {
    name: 'config/public file remapped by server.publicRoutes',
    url: '/renamed.txt',
    file: 'public/remapped.txt',
  },
  {
    name: 'config/upload file with a hash-like name',
    url: '/upload/report.0123456789ab.txt',
    file: 'upload/report.0123456789ab.txt',
  },
  {
    name: 'server.publicDir file with a hash-like name',
    url: '/locales/en.0123456789ab.json',
    file: 'locales/en.0123456789ab.json',
  },
  {
    name: 'server.publicDir file inside static/ with a hash-like name',
    url: '/static/locales/fr.0123456789ab.json',
    file: 'static/locales/fr.0123456789ab.json',
  },
  { name: 'favicon', url: '/favicon.ico', file: 'favicon.ico' },
];

const readDistFile = (file: string) => fse.readFile(path.join(distDir, file));

async function startServer(variant?: string) {
  const port = await getPort();
  const app = await modernServe(appDir, port, {
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: 'production',
      TEST_DIST,
      STATIC_CACHE_CONTROL: variant ?? '',
    },
  });
  return { app, host: `http://localhost:${port}` };
}

beforeAll(async () => {
  await modernBuild(appDir, [], { env: { TEST_DIST } });
  const hashedFiles = await Promise.all(
    [
      ['hashed JS asset', 'static/js', 'js'],
      ['hashed CSS asset', 'static/css', 'css'],
      ['hashed media asset', 'static/image', 'png'],
    ].map(async ([name, dir, extension]) => {
      const file = await findHashedAsset(dir, extension);
      return { name, url: `/${file}`, file, hashed: true };
    }),
  );
  staticFiles = [
    ...hashedFiles,
    ...unhashedFiles.map(file => ({ ...file, hashed: false })),
  ];
});

afterAll(async () => {
  await fse.remove(distDir);
});

const variants: {
  variant?: string;
  hashed: string | null;
  unhashed: string | null;
}[] = [
  { variant: undefined, hashed: HASHED_DEFAULT, unhashed: UNHASHED_DEFAULT },
  { variant: 'true', hashed: HASHED_DEFAULT, unhashed: UNHASHED_DEFAULT },
  {
    variant: 'custom',
    hashed: 'public, max-age=86400',
    unhashed: 'public, max-age=300',
  },
  {
    variant: 'hashed-only',
    hashed: 'public, max-age=600',
    unhashed: UNHASHED_DEFAULT,
  },
  { variant: 'false', hashed: null, unhashed: null },
];

describe.each(variants)(
  'server.staticCacheControl: $variant',
  ({ variant, hashed, unhashed }) => {
    let app: unknown;
    let host: string;

    beforeAll(async () => {
      ({ app, host } = await startServer(variant));
    });

    afterAll(async () => {
      await killApp(app, true);
    });

    test('sets Cache-Control and ETag on every kind of static file', async () => {
      for (const { name, url, file, hashed: isHashed } of staticFiles) {
        const res = await fetch(`${host}${url}`);
        const body = Buffer.from(await res.arrayBuffer());
        expect({ name, status: res.status }).toEqual({ name, status: 200 });
        expect(body).toEqual(await readDistFile(file));
        expect({
          name,
          cacheControl: res.headers.get('cache-control'),
        }).toEqual({ name, cacheControl: isHashed ? hashed : unhashed });
        // The ETag is kept when Cache-Control is disabled.
        const etag = res.headers.get('etag');
        expect(etag).toMatch(ETAG_REGEX);
        // The ETag starts with the size of the content in hex.
        expect(Number.parseInt(ETAG_REGEX.exec(etag!)![1], 16)).toBe(
          body.byteLength,
        );
      }
    });

    test('answers a matching If-None-Match with 304', async () => {
      for (const { name, url } of staticFiles) {
        const first = await fetch(`${host}${url}`);
        await first.arrayBuffer();
        const etag = first.headers.get('etag')!;
        const strong = etag.replace(/^W\//, '');
        for (const ifNoneMatch of [
          etag,
          // Compared with the weak comparison.
          strong,
          `"other", ${etag}`,
          '*',
        ]) {
          const res = await fetch(`${host}${url}`, {
            headers: { 'If-None-Match': ifNoneMatch },
          });
          expect({ name, ifNoneMatch, status: res.status }).toEqual({
            name,
            ifNoneMatch,
            status: 304,
          });
          expect(await res.text()).toBe('');
          expect(res.headers.get('etag')).toBe(etag);
          expect(res.headers.get('cache-control')).toBe(
            first.headers.get('cache-control'),
          );
        }
      }
    });

    test('answers a different If-None-Match with the file', async () => {
      const { url, file } = staticFiles[0];
      const res = await fetch(`${host}${url}`, {
        headers: { 'If-None-Match': 'W/"0-other"' },
      });
      expect(res.status).toBe(200);
      expect(Buffer.from(await res.arrayBuffer())).toEqual(
        await readDistFile(file),
      );
    });

    test('sends the same headers for HEAD requests', async () => {
      for (const { name, url } of staticFiles) {
        const get = await fetch(`${host}${url}`);
        await get.arrayBuffer();
        const head = await fetch(`${host}${url}`, { method: 'HEAD' });
        expect({ name, status: head.status }).toEqual({ name, status: 200 });
        expect(await head.text()).toBe('');
        expect(head.headers.get('etag')).toBe(get.headers.get('etag'));
        expect(head.headers.get('cache-control')).toBe(
          get.headers.get('cache-control'),
        );

        const notModified = await fetch(`${host}${url}`, {
          method: 'HEAD',
          headers: { 'If-None-Match': get.headers.get('etag')! },
        });
        expect({ name, status: notModified.status }).toEqual({
          name,
          status: 304,
        });
      }
    });

    test('keeps Cache-Control set by a middleware', async () => {
      const before = await fetch(`${host}/upload/no-store.txt`);
      expect(before.status).toBe(200);
      expect(before.headers.get('cache-control')).toBe('private, no-store');
      expect(before.headers.get('etag')).toMatch(ETAG_REGEX);

      const after = await fetch(`${host}/after.txt`);
      expect(after.status).toBe(200);
      expect(after.headers.get('cache-control')).toBe('public, max-age=60');
      expect(after.headers.get('etag')).toMatch(ETAG_REGEX);
    });

    test('does not add the headers to HTML pages', async () => {
      const res = await fetch(host);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('<div id="root">');
      expect(res.headers.get('cache-control')).toBeNull();
      expect(res.headers.get('etag')).toBeNull();
    });
  },
);

// In development, build assets and the files copied by the bundler, such as
// `config/upload`, are served by the Rsbuild dev server, so only the files
// from `config/public` go through the static handler.
describe.each([
  { variant: undefined, cacheControl: 'no-cache' },
  { variant: 'custom', cacheControl: 'no-cache' },
  { variant: 'false', cacheControl: null },
])(
  'development, server.staticCacheControl: $variant',
  ({ variant, cacheControl }) => {
    let app: unknown;
    let host: string;
    const devDist = `${TEST_DIST}-dev`;

    beforeAll(async () => {
      const port = await getPort();
      app = await launchApp(
        appDir,
        port,
        {},
        { TEST_DIST: devDist, STATIC_CACHE_CONTROL: variant ?? '' },
      );
      host = `http://localhost:${port}`;
    });

    afterAll(async () => {
      await killApp(app, true);
      await fse.remove(path.join(appDir, devDist));
    });

    test('revalidates config/public files', async () => {
      for (const url of [
        '/robots.txt',
        '/notes.0123456789ab.txt',
        '/renamed.txt',
      ]) {
        const res = await fetch(`${host}${url}`);
        await res.arrayBuffer();
        expect({ url, status: res.status }).toEqual({ url, status: 200 });
        expect({ url, cacheControl: res.headers.get('cache-control') }).toEqual(
          {
            url,
            cacheControl,
          },
        );
        const etag = res.headers.get('etag');
        expect(etag).toMatch(ETAG_REGEX);
        const notModified = await fetch(`${host}${url}`, {
          headers: { 'If-None-Match': etag! },
        });
        expect({ url, status: notModified.status }).toEqual({
          url,
          status: 304,
        });
      }
    });
  },
);

// The server config is written to the build output, so the deployed server
// uses the value from build time, without `modern.config.ts`.
describe('node deploy output', () => {
  const deployDist = `${TEST_DIST}-deploy`;
  const outputDir = path.join(appDir, '.output');
  let app: unknown;

  afterAll(async () => {
    await killApp(app, true);
    await fse.remove(outputDir);
    await fse.remove(path.join(appDir, deployDist));
  });

  test('serves static files with the configured headers', async () => {
    await modernBuild(appDir, [], {
      env: { TEST_DIST: deployDist, STATIC_CACHE_CONTROL: 'custom' },
    });
    await execa('npx modern deploy --skip-build', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'node',
        TEST_DIST: deployDist,
        STATIC_CACHE_CONTROL: 'custom',
      },
    });
    const port = await getPort();
    app = await runContinuousTask(['.output/index.js'], undefined, {
      cwd: appDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: port,
        STATIC_CACHE_CONTROL: '',
      },
      waitMessage: /Server is listening on/i,
    });
    const host = `http://localhost:${port}`;

    for (const { name, url, file, hashed } of staticFiles) {
      const res = await fetch(`${host}${url}`);
      expect({ name, status: res.status }).toEqual({ name, status: 200 });
      expect(Buffer.from(await res.arrayBuffer())).toEqual(
        await fse.readFile(path.join(outputDir, file)),
      );
      expect({ name, cacheControl: res.headers.get('cache-control') }).toEqual({
        name,
        cacheControl: hashed ? 'public, max-age=86400' : 'public, max-age=300',
      });
      const etag = res.headers.get('etag')!;
      expect(etag).toMatch(ETAG_REGEX);
      const notModified = await fetch(`${host}${url}`, {
        headers: { 'If-None-Match': etag },
      });
      expect({ name, status: notModified.status }).toEqual({
        name,
        status: 304,
      });
    }
  });
});
