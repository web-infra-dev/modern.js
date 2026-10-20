import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(packageRoot, '../../..');
const appTools = path.join(
  repoRoot,
  'packages/solutions/app-tools/bin/modern.js',
);
const run = (bin, args, cwd) => {
  try {
    return execFileSync(process.execPath, [bin, ...args], {
      cwd,
      env: { ...process.env, CODESMITH_ENV: 'production' },
      stdio: 'pipe',
      timeout: 120_000,
    });
  } catch (error) {
    throw new Error(
      `${bin} ${args.join(' ')} failed:\n${error.stdout?.toString() ?? ''}\n${error.stderr?.toString() ?? ''}`,
    );
  }
};

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
  return port;
}

/** Exercise generated projects using built workspace dependencies, without relying on examples. */
export async function verifyMcpStarters(directory) {
  const projects = JSON.parse(
    execFileSync('pnpm', ['list', '-r', '--depth', '-1', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }),
  );
  const workspace = new Map(
    projects.map(project => [project.name, project.path]),
  );
  let localDist;
  for (const mode of ['local', 'mf', 'server']) {
    const projectName = `starter-${mode}`;
    const target = path.join(directory, projectName);
    run(
      path.join(packageRoot, 'bin/run.js'),
      [
        projectName,
        '--template',
        mode === 'server' ? 'mcp-server' : 'mcp-apps',
        '--sub',
        '--no-agents-md',
        ...(mode === 'mf' ? ['--mf'] : []),
      ],
      directory,
    );
    const pkg = JSON.parse(
      await readFile(path.join(target, 'package.json'), 'utf8'),
    );
    for (const name of Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    })) {
      let source = workspace.get(name);
      if (!source) {
        for (const base of [
          'packages/toolkit/create/node_modules',
          'packages/toolkit/mcp-apps/node_modules',
          'node_modules',
          'node_modules/.pnpm/node_modules',
        ]) {
          const candidate = path.join(repoRoot, base, name);
          try {
            await access(candidate);
            source = candidate;
            break;
          } catch {}
        }
      }
      assert.ok(
        source,
        `Install workspace dependencies before running this test: ${name}`,
      );
      const destination = path.join(target, 'node_modules', name);
      await mkdir(path.dirname(destination), { recursive: true });
      await symlink(source, destination, 'dir');
    }
    if (mode === 'mf') {
      const filename = path.join(target, 'module-federation.config.ts');
      const source = await readFile(filename, 'utf8');
      await writeFile(
        filename,
        source
          .replace("filePath: 'static'", "filePath: 'federation'")
          .replace(
            "filename: 'static/remoteEntry.js'",
            "filename: 'chunks/remoteEntry.js'",
          ),
      );
    }
    run(
      path.join(target, 'node_modules/typescript/bin/tsc'),
      ['--noEmit'],
      target,
    );
    run(appTools, ['build'], target);
    if (mode === 'local') localDist = path.join(target, 'dist');
    const port = await freePort();
    const endpoint = `http://127.0.0.1:${port}/mcp`;
    const child = spawn(process.execPath, [appTools, 'serve'], {
      cwd: target,
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
    });
    child.stderr.on('data', chunk => {
      output += chunk;
    });
    try {
      const rpc = async (method, params = {}) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          signal: AbortSignal.timeout(5000),
        });
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.ok(!body.error, JSON.stringify(body));
        return body.result;
      };
      const deadline = Date.now() + 30_000;
      while (true) {
        if (child.exitCode !== null)
          throw new Error(`${mode} server exited: ${output}`);
        try {
          const response = await fetch(endpoint, {
            signal: AbortSignal.timeout(1000),
          });
          if (response.status === 405) break;
        } catch {}
        if (Date.now() >= deadline)
          throw new Error(`${mode} startup timed out: ${output}`);
        await delay(100);
      }
      const tools = (await rpc('tools/list')).tools;
      assert.ok(tools.some(tool => tool.name === 'greet'));
      const result = await rpc('tools/call', {
        name: 'greet',
        arguments: { name: mode },
      });
      assert.equal(result.structuredContent.message, `Hello, ${mode}!`);
      const resources = await rpc('resources/list');
      if (mode === 'server') {
        assert.deepEqual(resources.resources, []);
      } else {
        const uri = tools.find(tool => tool.name === 'greet')._meta.ui
          .resourceUri;
        const resource = (await rpc('resources/read', { uri })).contents[0];
        assert.ok(resource.text.includes('<script'));
        for (const match of resource.text.matchAll(
          /<script[^>]+src="([^"]+)"/g,
        )) {
          assert.equal((await fetch(new URL(match[1], endpoint))).status, 200);
        }
        if (mode === 'mf') {
          const manifestUrl =
            result.structuredContent.resource.moduleFederation.remoteEntry;
          const response = await fetch(manifestUrl);
          assert.equal(response.status, 200);
          assert.equal((await response.json()).name, 'mcp_ui');
          assert.ok(new URL(manifestUrl).pathname.startsWith('/federation/'));
          const artifacts = JSON.parse(
            await readFile(
              path.join(target, 'dist/mcp-apps/ui/mf-remotes.json'),
              'utf8',
            ),
          );
          for (const name of [
            artifacts[0].manifest,
            ...artifacts[0].assets.filter(name => name.endsWith('.js')),
          ]) {
            const assetUrl = new URL(name, endpoint);
            const preflight = await fetch(assetUrl, {
              method: 'OPTIONS',
              headers: { Origin: 'null' },
            });
            assert.equal(preflight.status, 204, assetUrl.href);
            assert.equal(
              preflight.headers.get('Access-Control-Allow-Origin'),
              '*',
            );
            assert.equal((await fetch(assetUrl)).status, 200);
          }
        }
      }
      console.log(
        `PASS: generated ${mode} project typechecks, builds and serves MCP tools/resources.`,
      );
    } finally {
      if (child.exitCode === null) {
        const exited = once(child, 'exit');
        child.kill('SIGTERM');
        const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
        await exited;
        clearTimeout(timer);
      }
    }
  }
  return localDist;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'modern-mcp-starters-'),
  );
  try {
    await verifyMcpStarters(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
