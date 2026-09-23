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
    if (await check()) return;
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
    const original = await fs.readFile(viewPath, 'utf8');
    const dev = await launch(app, ['dev']);
    await fs.writeFile(
      viewPath,
      original.replace('Greet again', 'Greet locally'),
    );
    await until(async () =>
      (
        await rpc('resources/read', { uri: 'ui://local/greet' })
      ).result?.contents[0].text.includes('Greet locally'),
    );
    await fs.writeFile(viewPath, 'invalid TSX !!!');
    await until(async () =>
      (
        await rpc('resources/read', { uri: 'ui://local/greet' })
      ).result?.contents[0].text.includes('Greet locally'),
    );
    await fs.writeFile(viewPath, original);
    await stop(dev);
    await command(app, ['build']);
    await expect(
      fs.access(path.join(app, 'dist/mcp/tools.js')),
    ).rejects.toThrow();
    const production = await launch(app, ['serve']);
    const listed = await rpc('tools/list');
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
    expect(
      (await rpc('resources/read', { uri })).result.contents[0].text,
    ).toContain('Greet again');
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
    const toolsPath = path.join(app, 'mcp/tools.ts');
    const tools = await fs.readFile(toolsPath, 'utf8');
    await fs.writeFile(
      toolsPath,
      `import { prefix } from './salutation';\n${tools.replace('Hello,', '${prefix},')}`,
    );
    await until(async () =>
      (await fs.readFile(path.join(output, 'last-child.log'), 'utf8')).includes(
        'rebuild failed',
      ),
    );
    expect(await greet()).toBe('Hello, Ada!');
    // Recover a missing dependency when the new file is created after a failed build.
    await fs.writeFile(
      path.join(app, 'mcp/salutation.ts'),
      "export const prefix = 'Welcome';",
    );
    await until(async () => (await greet()) === 'Welcome, Ada!');
    await fs.writeFile(
      path.join(app, 'mcp_apps.ts'),
      (await fs.readFile(path.join(app, 'mcp_apps.ts'), 'utf8')).replace(
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
        'mcpApps();',
        "mcpApps({ serverInfo: { name: 'reloaded-bff', version: '2' } });",
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
      path.join(app, 'dist/mcp-apps/mcp_apps.mjs'),
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
    expect((await rpc('resources/list')).result.resources).toEqual([]);
  }, 180_000);
});
