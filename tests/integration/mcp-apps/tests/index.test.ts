import { type ChildProcess, execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const fixture = path.resolve(__dirname, '..');
const repo = path.resolve(fixture, '../../..');
const modern = path.join(repo, 'packages/solutions/app-tools/bin/modern.js');
const creator = path.join(repo, 'packages/toolkit/create/bin/run.js');
// BFF's dependency cache intentionally ignores dot-directories. Use a visible
// fixture directory so API hot reload exercises the same path as real projects.
const output = path.join(fixture, 'test-output');
const children = new Set<ChildProcess>();
const relocations = new Set<string>();
let port: number;
let endpoint = '/mcp';
beforeEach(() => {
  endpoint = '/mcp';
});

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No port');
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
  return address.port;
}
const env = () => ({
  ...process.env,
  PORT: String(port),
  MCP_UI_ORIGIN: `http://127.0.0.1:${port}`,
  MODERN_SERVER_LOG_LEVEL: 'error',
});
async function command(cwd: string, args: string[]) {
  return exec(process.execPath, [modern, ...args], {
    cwd,
    env: { ...env(), NODE_ENV: 'production' },
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
  });
}
async function launch(cwd: string, args: string[], direct = false) {
  const child = spawn(process.execPath, direct ? args : [modern, ...args], {
    cwd,
    env: {
      ...env(),
      NODE_ENV: !direct && args[0] === 'dev' ? 'development' : 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  let log = '';
  child.stdout?.on('data', chunk => {
    log = (log + chunk).slice(-20000);
    fs.writeFile(path.join(output, 'last-child.log'), log).catch(() => {});
  });
  child.stderr?.on('data', chunk => {
    log = (log + chunk).slice(-20000);
    fs.writeFile(path.join(output, 'last-child.log'), log).catch(() => {});
  });
  await until(
    async () => {
      if (child.exitCode !== null) throw new Error(`Server exited: ${log}`);
      try {
        return (await rpc('tools/list')).result?.tools?.[0]?.name === 'greet';
      } catch {
        return false;
      }
    },
    () => log,
  );
  return child;
}
async function stop(child: ChildProcess) {
  children.delete(child);
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  await exited;
  clearTimeout(timer);
}
async function until(check: () => Promise<boolean>, detail = () => '') {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      /* Framework restart or compilation in progress. */
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${detail()}`);
}
async function rpc(method: string, params = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(3000),
  });
  return response.json();
}
async function uiAssets(uri: string) {
  const resource = (await rpc('resources/read', { uri })).result.contents[0];
  const html = resource.text as string;
  const urls = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(
    match => new URL(match[1], `http://127.0.0.1:${port}/`).href,
  );
  expect(urls.length).toBeGreaterThan(0);
  const assets = await Promise.all(
    urls.map(async url => {
      const response = await fetch(url);
      expect(response.status).toBe(200);
      return response.text();
    }),
  );
  return assets.join('\n');
}
async function verifyBrowserUI() {
  const hostPort = await freePort();
  const host = spawn(
    process.execPath,
    [path.join(repo, 'packages/toolkit/mcp-apps/scripts/browser-fixture.mjs')],
    {
      cwd: repo,
      env: {
        ...process.env,
        MCP_ENDPOINT: `http://127.0.0.1:${port}/mcp`,
        MCP_HOST_PORT: String(hostPort),
      },
      stdio: 'ignore',
    },
  );
  children.add(host);
  try {
    await until(async () => (await fetch(`http://127.0.0.1:${hostPort}`)).ok);
    // Keep browser function serialization outside the test runner's transforms.
    await exec(
      process.execPath,
      [
        path.join(fixture, 'scripts/verify-ui.mjs'),
        `http://127.0.0.1:${hostPort}`,
      ],
      { timeout: 45000 },
    ).catch(error => {
      throw new Error(`${error.stdout}\n${error.stderr}`);
    });
  } finally {
    await stop(host);
  }
}

async function greet() {
  return (
    await rpc('tools/call', { name: 'greet', arguments: { name: 'Ada' } })
  ).result?.structuredContent?.message;
}
async function generate(name: string, template: string, mf = false) {
  await exec(
    process.execPath,
    [
      creator,
      name,
      '--template',
      template,
      '--no-agents-md',
      ...(mf ? ['--mf'] : []),
    ],
    { cwd: output },
  );
  return path.join(output, name);
}

beforeAll(async () => {
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
});
afterEach(async () => {
  await Promise.all([...children].map(stop));
  await Promise.all(
    [...relocations].map(dir => fs.rm(dir, { recursive: true, force: true })),
  );
  relocations.clear();
});
afterAll(async () => {
  await fs.rm(output, { recursive: true, force: true });
});

describe('created Modern.js MCP projects', () => {
  test('default local UI compiles and serves without MF', async () => {
    port = await freePort();
    const app = await generate('local-app', 'mcp-apps');
    const viewPath = path.join(app, 'src/components/Greeting.tsx');
    const base = await fs.readFile(viewPath, 'utf8');
    const original = `import marker from '@mcp-message';\nimport styles from './Greeting.module.css';\n${base.replace('<section ', '<section className={styles.card} data-alias={marker} data-build={process.env.MCP_BUILD_LABEL} ')}`;
    await fs.writeFile(viewPath, original);
    await fs.writeFile(
      path.join(app, 'src/mcp-test.d.ts'),
      `declare module '@mcp-message' { const value: string; export default value; }`,
    );
    await fs.writeFile(
      path.join(app, 'src/message.ts'),
      "export default 'alias-from-modern';",
    );
    await fs.writeFile(
      path.join(app, 'src/components/Greeting.module.css'),
      '.card { color: rgb(12, 34, 56); }',
    );
    await fs.writeFile(
      path.join(app, 'src/pre-entry.ts'),
      "document.documentElement.dataset.preentry = 'ready';",
    );
    await fs.writeFile(
      path.join(app, 'src/modern.runtime.ts'),
      `import { defineRuntimeConfig } from '@modern-js/runtime';
export default defineRuntimeConfig({ plugins: [{ name: 'mcp-test-runtime', setup(api) { api.onBeforeRender(() => { document.documentElement.dataset.runtime = 'ready'; }); } }] });`,
    );
    const configPath = path.join(app, 'modern.config.ts');
    await fs.writeFile(
      configPath,
      (await fs.readFile(configPath, 'utf8')).replace(
        'export default defineConfig({',
        `export default defineConfig({ source: { preEntry: ['./src/pre-entry.ts'], alias: { '@mcp-message': './src/message.ts' }, globalVars: { 'process.env.MCP_BUILD_LABEL': 'configured-by-modern' } },`,
      ),
    );
    const dev = await launch(app, ['dev']);
    await verifyBrowserUI();
    await fs.writeFile(
      viewPath,
      original.replace('Greet again', 'Greet locally'),
    );
    await until(async () =>
      (await uiAssets('ui://local/greet')).includes('Greet locally'),
    );
    await fs.writeFile(viewPath, original);
    const definitionPath = path.join(app, 'api/mcp_apps.ts');
    await fs.writeFile(
      definitionPath,
      (await fs.readFile(definitionPath, 'utf8')).replace(
        "name: 'greet',",
        "name: 'greet', title: 'Modern entry reloaded',",
      ),
    );
    await until(
      async () =>
        (await rpc('tools/list')).result?.tools[0].title ===
        'Modern entry reloaded',
    );
    await verifyBrowserUI();
    await stop(dev);
    await command(app, ['build']);
    await expect(
      fs.access(path.join(app, 'dist/api/mcp-tools.js')),
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(app, 'dist/mcp-apps/mcp_apps.mjs')),
    ).rejects.toThrow();
    const production = await launch(app, ['serve']);
    await verifyBrowserUI();
    const listed = await rpc('tools/list');
    expect(
      listed.result.tools.map((tool: { name: string }) => tool.name),
    ).toEqual(['greet', 'add_numbers']);
    const added = await rpc('tools/call', {
      name: 'add_numbers',
      arguments: { a: 2, b: 3 },
    });
    expect(added.result.structuredContent.sum).toBe(5);
    expect(added.result.structuredContent.viewProps).toEqual({
      a: 2,
      b: 3,
      sum: 5,
    });
    const sumUri = listed.result.tools[1]._meta.ui.resourceUri;
    expect(sumUri).toBe('ui://local/add_numbers');
    expect(
      (await rpc('resources/read', { uri: sumUri })).result.contents[0]
        .mimeType,
    ).toBe('text/html;profile=mcp-app');
    expect(await uiAssets(sumUri)).toContain('Addition');
    const uri = listed.result.tools[0]._meta.ui.resourceUri;
    expect(uri).toBe('ui://local/greet');
    const resource = await rpc('resources/read', { uri });
    expect(resource.result.contents[0].text).toContain('<script');
    expect(resource.result.contents[0].text).not.toContain('moduleFederation');
    expect(
      (await rpc('tools/call', { name: 'greet', arguments: { name: 'Ada' } }))
        .result.structuredContent.viewProps.message,
    ).toBe('Hello, Ada!');
    await stop(production);
    await command(app, ['deploy', '--skip-build']);
    const relocated = await fs.mkdtemp(
      path.join(os.tmpdir(), 'modern-local-output-'),
    );
    relocations.add(relocated);
    await fs.cp(path.join(app, '.output'), relocated, { recursive: true });
    await fs.rm(app, { recursive: true, force: true });
    await launch(relocated, ['index.js'], true);
    expect(await greet()).toBe('Hello, Ada!');
    expect(await uiAssets(uri)).toContain('Greet again');
    expect(await uiAssets(sumUri)).toContain('Addition');
    expect(
      (
        await rpc('tools/call', {
          name: 'add_numbers',
          arguments: { a: -2, b: 0.5 },
        })
      ).result.structuredContent.sum,
    ).toBe(-1.5);
    await verifyBrowserUI();
  }, 300_000);

  test('UI project: dev reload, production artifacts, normal pages, BFF and relocated deploy', async () => {
    port = await freePort();
    const app = await generate('app', 'mcp-apps', true);
    // MCP and ordinary API functions share the BFF route dispatcher.
    await fs.mkdir(path.join(app, 'api/lambda'), { recursive: true });
    await fs.writeFile(
      path.join(app, 'api/lambda/health.ts'),
      `export const get = () => ({ healthy: true });`,
    );
    const dev = await launch(app, ['dev']);
    expect(await greet()).toBe('Hello, Ada!');
    expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(200);
    expect(
      await (await fetch(`http://127.0.0.1:${port}/mcp/health`)).json(),
    ).toEqual({ healthy: true });
    expect((await fetch(`http://127.0.0.1:${port}/mcp`)).status).toBe(405);
    expect(
      (await fetch(`http://127.0.0.1:${port}/static/mf-manifest.json`)).status,
    ).toBe(200);
    const devManifest = await (
      await fetch(`http://127.0.0.1:${port}/static/mf-manifest.json`)
    ).json();
    expect(devManifest.metaData.publicPath).toBe(`http://127.0.0.1:${port}/`);
    const remoteResult = await rpc('tools/call', {
      name: 'greet',
      arguments: { name: 'Ada' },
    });
    expect(
      remoteResult.result.structuredContent.resource.moduleFederation
        .remoteEntry,
    ).toBe(`http://127.0.0.1:${port}/static/mf-manifest.json`);
    const preflight = await fetch(
      `http://127.0.0.1:${port}/static/mf-manifest.json`,
      {
        method: 'OPTIONS',
        headers: {
          origin: 'https://www.doubao.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Private-Network': 'true',
        },
      },
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(preflight.headers.get('Access-Control-Allow-Private-Network')).toBe(
      'true',
    );
    const toolsPath = path.join(app, 'api/mcp-tools.ts');
    const tools = await fs.readFile(toolsPath, 'utf8');
    await fs.writeFile(toolsPath, tools.replace('Hello,', 'Welcome,'));
    await until(async () => (await greet()) === 'Welcome, Ada!');
    await fs.writeFile(
      path.join(app, 'api/mcp_apps.ts'),
      (await fs.readFile(path.join(app, 'api/mcp_apps.ts'), 'utf8')).replace(
        "name: 'greet',",
        "name: 'greet', title: 'Reloaded',",
      ),
    );
    await until(
      async () =>
        (await rpc('tools/list')).result.tools[0].title === 'Reloaded',
    );
    const routePath = path.join(app, 'api/lambda/index.ts');
    await fs.writeFile(
      routePath,
      (await fs.readFile(routePath, 'utf8')).replace(
        'mcpApps(definition);',
        "mcpApps(definition, { serverInfo: { name: 'reloaded-bff', version: '2' } });",
      ),
    );
    await until(
      async () =>
        (
          await rpc('initialize', {
            protocolVersion: '2025-11-25',
            capabilities: {},
            clientInfo: { name: 'test', version: '1' },
          })
        ).result?.serverInfo?.name === 'reloaded-bff',
    );
    await stop(dev);
    await command(app, ['build']);
    const compiled = await fs.readFile(
      path.join(app, 'dist/api/mcp_apps.js'),
      'utf8',
    );
    expect(compiled).not.toContain(app);
    await fs.writeFile(toolsPath, tools.replace('Hello,', 'Source-only,'));
    const production = await launch(app, ['serve']);
    expect(await greet()).toBe('Welcome, Ada!');
    const manifestResponse = await fetch(
      `http://127.0.0.1:${port}/static/mf-manifest.json`,
      { headers: { origin: 'null' } },
    );
    expect(manifestResponse.headers.get('access-control-allow-origin')).toBe(
      '*',
    );
    const toolPreflight = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'OPTIONS',
      headers: {
        origin: 'https://www.doubao.com',
        'Access-Control-Request-Private-Network': 'true',
      },
    });
    expect(
      toolPreflight.headers.get('Access-Control-Allow-Private-Network'),
    ).toBeNull();
    const listed = await rpc('tools/list');
    const resource = await rpc('resources/read', {
      uri: listed.result.tools[0]._meta.ui.resourceUri,
    });
    expect(resource.result.contents[0].text).toContain('<script');
    await stop(production);
    await command(app, ['deploy', '--skip-build']);
    const relocated = await fs.mkdtemp(
      path.join(os.tmpdir(), 'modern-mcp-output-'),
    );
    relocations.add(relocated);
    await fs.cp(path.join(app, '.output'), relocated, { recursive: true });
    await fs.rm(app, { recursive: true, force: true });
    await launch(relocated, ['index.js'], true);
    expect(await greet()).toBe('Welcome, Ada!');
    const html = await rpc('resources/read', {
      uri: listed.result.tools[0]._meta.ui.resourceUri,
    });
    expect(html.result.contents[0].text).toContain('<script');
  }, 300_000);

  test('ESM server-only project: nested BFF route and custom output directory', async () => {
    port = await freePort();
    const app = await generate('server', 'mcp-server');
    const packagePath = path.join(app, 'package.json');
    const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    await fs.writeFile(packagePath, JSON.stringify({ ...pkg, type: 'module' }));
    const tsconfigPath = path.join(app, 'tsconfig.json');
    const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf8'));
    tsconfig.compilerOptions.module = 'esnext';
    tsconfig.compilerOptions.moduleResolution = 'bundler';
    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig));
    endpoint = '/mcp/nested/mcp';
    await fs.mkdir(path.join(app, 'api/lambda/nested'));
    await fs.rename(
      path.join(app, 'api/lambda/index.ts'),
      path.join(app, 'api/lambda/nested/mcp.ts'),
    );
    const nestedRoute = path.join(app, 'api/lambda/nested/mcp.ts');
    await fs.writeFile(
      nestedRoute,
      (await fs.readFile(nestedRoute, 'utf8')).replace(
        "'../mcp_apps'",
        "'../../mcp_apps'",
      ),
    );
    const configPath = path.join(app, 'modern.config.ts');
    await fs.writeFile(
      configPath,
      (await fs.readFile(configPath, 'utf8')).replace(
        'export default defineConfig({',
        "export default defineConfig({ output: { distPath: { root: 'custom-output' } },",
      ),
    );
    await expect(fs.access(path.join(app, 'src'))).rejects.toThrow();
    const dev = await launch(app, ['dev']);
    expect(await greet()).toBe('Hello, Ada!');
    await stop(dev);
    await command(app, ['build']);
    await launch(app, ['serve']);
    expect(await greet()).toBe('Hello, Ada!');
    expect(
      (await rpc('tools/list')).result.tools.map(
        (tool: { name: string }) => tool.name,
      ),
    ).toEqual(['greet', 'add_numbers']);
    expect(
      (
        await rpc('tools/call', {
          name: 'add_numbers',
          arguments: { a: 2, b: 3 },
        })
      ).result.structuredContent,
    ).toEqual({ a: 2, b: 3, sum: 5 });
    expect((await rpc('resources/list')).result.resources).toEqual([]);
  }, 180_000);
});
