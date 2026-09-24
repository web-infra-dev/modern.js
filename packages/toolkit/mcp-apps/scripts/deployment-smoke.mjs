import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(packageRoot, '../../..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-deployment-'));
let child;
try {
  execFileSync('pnpm', ['pack', '--pack-destination', temp], {
    cwd: packageRoot,
    stdio: 'pipe',
  });
  const archive = (await readdir(temp)).find(name => name.endsWith('.tgz'));
  assert.ok(archive);
  await writeFile(
    path.join(temp, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        '@modern-js/mcp-apps': `file:./${archive}`,
        '@hono/node-server': '2.1.1',
        hono: '^4.11.7',
      },
    }),
  );
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--omit=dev',
      '--omit=optional',
      '--package-lock=false',
      '--no-audit',
      '--no-fund',
    ],
    { cwd: temp, stdio: 'pipe', timeout: 120_000 },
  );
  await cp(
    path.join(packageRoot, 'tests/fixtures/hono-server.mjs'),
    path.join(temp, 'index.mjs'),
  );
  await cp(
    path.join(repoRoot, 'examples/mcp-apps-modern/dist'),
    path.join(temp, 'application'),
    { recursive: true },
  );
  await writeFile(
    path.join(temp, 'application/package.json'),
    JSON.stringify({ type: 'commonjs' }),
  );
  const installed = JSON.parse(
    await readFile(
      path.join(temp, 'node_modules/@modern-js/mcp-apps/package.json'),
      'utf8',
    ),
  );
  assert.ok(
    Object.keys(installed.dependencies).every(
      name => !name.includes('devtools'),
    ),
  );
  assert.ok(!JSON.stringify(installed.exports).includes('modern:source'));
  execFileSync(
    process.execPath,
    [
      '--input-type=commonjs',
      '-e',
      `
    require('@modern-js/mcp-apps/server');
    for (const name of ['react', '@modern-js/app-tools']) {
      try { require.resolve(name); throw new Error('Unexpected dependency: ' + name); }
      catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
    }
  `,
    ],
    { cwd: temp, stdio: 'pipe' },
  );
  execFileSync(
    process.execPath,
    [
      '--input-type=commonjs',
      '-e',
      `
    const assert = require('node:assert/strict');
    const { loadMcpAppsConfig, bindUiResources, createMcpHandler } = require('@modern-js/mcp-apps/server');
    loadMcpAppsConfig(require('node:path').resolve('application/api/mcp_apps.js')).then(definition => createMcpHandler(bindUiResources(definition, { directory: require('node:path').resolve('application/mcp-apps/ui'), assetBase: 'request' }))(new Request('http://localhost/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'resources/read', params: { uri: 'ui://local/greet' } }) }))).then(async response => {
      const result = await response.json();
      assert.ok(result.result.contents[0].text.includes('<script'));
    }).catch(error => { console.error(error); process.exitCode = 1; });
  `,
    ],
    { cwd: temp, stdio: 'pipe', timeout: 15000 },
  );
  child = spawn(process.execPath, ['index.mjs'], {
    cwd: temp,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: '0',
      MCP_APPS_CONFIG: path.join(temp, 'application/api/mcp_apps.js'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const endpoint = await new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(
      () => reject(new Error(`Server startup timeout: ${stderr}`)),
      15_000,
    );
    child.stderr.on('data', chunk => {
      stderr += chunk;
    });
    child.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Server exited ${code}: ${stderr}`));
    });
    child.stdout.on('data', chunk => {
      stdout += chunk;
      const match = stdout.match(/MCP endpoint: (http:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
  });
  const rpc = async (method, params) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(!payload.error, JSON.stringify(payload));
    return payload.result;
  };
  await rpc('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'deployment-smoke', version: '1' },
  });
  const listed = await rpc('tools/list', {});
  const result = await rpc('tools/call', {
    name: 'greet',
    arguments: { name: 'Independent server' },
  });
  assert.equal(result.structuredContent.message, 'Hello, Independent server!');
  const resource = await rpc('resources/read', {
    uri: listed.tools[0]._meta.ui.resourceUri,
  });
  assert.ok(resource.contents[0].text.includes('<script'));
  for (const match of resource.contents[0].text.matchAll(
    /<script[^>]+src="([^"]+)"/g,
  )) {
    const asset = await fetch(new URL(match[1], endpoint));
    assert.equal(asset.status, 200);
  }
  assert.equal(
    result.structuredContent.resource.resourceUri,
    'ui://local/greet',
  );
  assert.ok(!resource.contents[0].text.includes(repoRoot));
  console.log(
    'PASS: packed ESM/CJS server runs from an isolated production install from compiled MCP artifacts without React, app-tools, UI source or ui-manifest.json.',
  );
} finally {
  if (child && child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    await exited;
  }
  await rm(temp, { recursive: true, force: true });
}
