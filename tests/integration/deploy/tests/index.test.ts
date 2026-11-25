import os from 'node:os';
import path from 'node:path';
import { execa, fs as fse } from '@modern-js/utils';
import {
  getPort,
  killApp,
  modernBuild,
  runContinuousTask,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const appDir = path.resolve(__dirname, '../');

async function checkAppRun(host: string) {
  // Page render
  const onePage = await fetch(`${host}/one`);
  expect(onePage.status).toBe(200);
  expect(await onePage.text()).toContain('<div id="item">');

  // Loader
  const oneLoader = await fetch(`${host}/one?__loader=one_page`);
  expect(oneLoader.status).toBe(200);
  expect(await oneLoader.text()).toContain('Hello Modern.js');

  // API
  const api = await fetch(`${host}/api/context`);
  expect(api.status).toBe(200);
  expect(api.headers.get('x-id')).toBe('1');
  expect(await api.json()).toEqual({
    message: 'Hello Modern.js',
  });
}

// The deployed server uses `server.staticCacheControl` from build time.
async function checkStaticCacheControl(host: string, outputDirectory: string) {
  const js = (await fse.readdir(path.join(outputDirectory, 'static/js'))).find(
    file => /\.[0-9a-f]{8,}\.js$/.test(file),
  );
  expect(js).toBeDefined();
  for (const [url, file, cacheControl] of [
    [`/static/js/${js}`, `static/js/${js}`, 'public, max-age=86400'],
    ['/robots.txt', 'public/robots.txt', 'public, max-age=300'],
  ]) {
    const res = await fetch(host + url);
    expect({
      url,
      status: res.status,
      cacheControl: res.headers.get('cache-control'),
    }).toEqual({ url, status: 200, cacheControl });
    expect(Buffer.from(await res.arrayBuffer())).toEqual(
      await fse.readFile(path.join(outputDirectory, file)),
    );
    const etag = res.headers.get('etag');
    expect(etag).toMatch(/^W\/"[0-9a-f]+-[\w-]{22}"$/);
    const notModified = await fetch(host + url, {
      headers: { 'If-None-Match': etag! },
    });
    expect({ url, status: notModified.status }).toEqual({ url, status: 304 });
  }
}

type Mode = 'csr' | 'server';
type Target = 'node' | 'vercel' | 'netlify';

async function cleanOutputs() {
  await Promise.all(
    ['dist', 'dist-netlify', '.output', '.vercel', '.netlify'].map(dir =>
      fse.remove(path.join(appDir, dir)),
    ),
  );
}

async function deploy(mode: Mode, target: Target) {
  // Server-side Netlify deployment rewrites its publish directory.
  const rebuild = mode === 'server' && target === 'netlify';
  await execa(
    'pnpm',
    ['exec', 'modern', 'deploy', ...(rebuild ? [] : ['--skip-build'])],
    {
      cwd: appDir,
      stdio: 'inherit',
      env: {
        DEPLOY_MODE: mode,
        MODERNJS_DEPLOY: target,
        ...(rebuild ? { TEST_DIST: 'dist-netlify' } : {}),
      },
    },
  );
}

describe.sequential('deploy csr', () => {
  beforeAll(async () => {
    await cleanOutputs();
    const build = await modernBuild(appDir, [], {
      env: { DEPLOY_MODE: 'csr' },
    });
    expect(build.code, build.stderr || build.stdout).toBe(0);
  });

  afterAll(cleanOutputs);

  test('support csr when deploy target is node', async () => {
    await deploy('csr', 'node');
    const outputDirectory = path.join(appDir, '.output');
    const bootstrapJs = path.join(outputDirectory, 'index.js');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');

    expect(await fse.pathExists(bootstrapJs)).toBe(true);
    expect(await fse.pathExists(path.join(outputDirectory, 'api'))).toBe(false);
    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
  });

  test('support csr when deploy target is vercel', async () => {
    await deploy('csr', 'vercel');

    const outputDirectory = path.join(appDir, '.vercel/output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(staticDirectory, 'html');
    const publicDirectory = path.join(staticDirectory, 'static');
    const configPath = path.join(outputDirectory, 'config.json');
    const config = await fse.readJson(configPath);

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(publicDirectory)).toBe(true);
    expect(config.version).toBe(3);
    expect(config).toMatchSnapshot();
  });

  test('support csr when deploy target is netlify', async () => {
    await deploy('csr', 'netlify');

    const outputDirectory = path.join(appDir, 'dist');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');
    const redirectPath = path.join(outputDirectory, '_redirects');
    const redirects = (await fse.readFile(redirectPath)).toString();

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(redirects).toMatchSnapshot();
  });
});

describe.sequential('deploy server', () => {
  beforeAll(async () => {
    await cleanOutputs();
    const build = await modernBuild(appDir, [], {
      env: { DEPLOY_MODE: 'server' },
    });
    expect(build.code, build.stderr || build.stdout).toBe(0);
  });

  afterAll(cleanOutputs);

  test('support server when deploy target is node', async () => {
    await deploy('server', 'node');
    const outputDirectory = path.join(appDir, '.output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');
    const apiFile = path.join(outputDirectory, 'api/lambda/index.js');
    const bootstrapPath = path.join(outputDirectory, 'index.js');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(apiFile)).toBe(true);
    expect(await fse.pathExists(bootstrapPath)).toBe(true);

    // Run the server outside the repository, so a dependency missing from
    // the output cannot be resolved from the workspace.
    const deployDirectory = await fse.mkdtemp(
      path.join(os.tmpdir(), 'modern-deploy-'),
    );
    await fse.copy(outputDirectory, deployDirectory);
    const port = await getPort();
    const app = await runContinuousTask(['index.js'], undefined, {
      cwd: deployDirectory,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: port,
      },
      waitMessage: /Server is listening on/i,
    });
    try {
      const host = `http://127.0.0.1:${port}`;
      await checkAppRun(host);
      await checkStaticCacheControl(host, deployDirectory);
    } finally {
      if (app) await killApp(app, true);
      await fse.remove(deployDirectory);
    }
  });

  test('support server when deploy target is vercel', async () => {
    await deploy('server', 'vercel');

    const outputDirectory = path.join(appDir, '.vercel/output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const funcsDirectory = path.join(
      outputDirectory,
      'functions',
      'index.func',
    );
    const funcsConfigPath = path.join(funcsDirectory, '.vc-config.json');
    const funcsConfig = await fse.readJson(funcsConfigPath);
    const bootstrapFile = path.join(funcsDirectory, 'index.js');
    const htmlDirectory = path.join(funcsDirectory, 'html');
    const publicDirectory = path.join(staticDirectory, 'static');
    const configPath = path.join(outputDirectory, 'config.json');
    const config = await fse.readJson(configPath);

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(publicDirectory)).toBe(true);
    expect(await fse.pathExists(bootstrapFile)).toBe(true);
    expect(config).toMatchSnapshot();
    expect({
      ...funcsConfig,
      runtime: expect.any(String),
    }).toMatchSnapshot();
  });

  test('support server when deploy target is netlify', async () => {
    await deploy('server', 'netlify');

    const publishDir = path.join(appDir, 'dist-netlify');
    const outputDirectory = path.join(appDir, '.netlify');
    const staticDirectory = path.join(publishDir, 'static');
    const funcsDirectory = path.join(outputDirectory, 'functions');
    const redirectFilePath = path.join(publishDir, '_redirects');
    const redirects = (await fse.readFile(redirectFilePath)).toString();

    const bootstrapFile = path.join(funcsDirectory, 'index.js');
    const htmlDirectory = path.join(funcsDirectory, 'html');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(bootstrapFile)).toBe(true);
    expect(redirects).toMatchSnapshot();
  });
});
