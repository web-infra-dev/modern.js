import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import getPort from 'get-port';
import treeKill from 'tree-kill';
const root = fileURLToPath(new URL('../', import.meta.url));
const hostRequire = createRequire(path.join(root, 'host/package.json'));
const modern = path.resolve(
  path.dirname(hostRequire.resolve('@modern-js/app-tools')),
  '../../bin/modern.js',
);
const names = [
  'host',
  'provider',
  'nested',
  'library',
  'providerV2',
  'libraryV2',
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function startLab(mode = 'dev', fixedPorts = false) {
  const ports = {};
  for (const [index, name] of names.entries()) {
    ports[name] = fixedPorts
      ? 4300 + index
      : await getPort({
          port: getPort.makeRange(14000, 24000),
          exclude: Object.values(ports),
        });
  }
  const processes = [];
  const servers = [];
  const failures = [];
  const logs = new Map();
  const env = {
    ...process.env,
    MF_LAB_PORTS: JSON.stringify(ports),
    MODERN_MF_AUTO_CORS: '1',
    NO_COLOR: '1',
    MODERN_SERVER_LOG_LEVEL: 'warn',
  };
  function launch(name, args, version = 'v1', continuous = false) {
    const cwd = path.join(root, name);
    const key = `${name}-${version}`;
    const child = spawn(process.execPath, args, {
      cwd,
      env: {
        ...env,
        MF_LAB_VERSION: version,
        NODE_ENV:
          args.includes('build') || mode === 'production'
            ? 'production'
            : 'development',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    processes.push(child);
    logs.set(key, '');
    for (const stream of [child.stdout, child.stderr])
      stream.on('data', chunk => {
        logs.set(key, (logs.get(key) + chunk).slice(-24000));
        if (process.env.MF_LAB_VERBOSE)
          process.stdout.write(`[${key}] ${chunk}`);
      });
    return new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (code, signal) => {
        if (continuous && !signal)
          failures.push(`${key} exited (${code})\n${logs.get(key)}`);
        if (!continuous)
          code === 0
            ? resolve()
            : reject(new Error(`${key} failed (${code})\n${logs.get(key)}`));
      });
      if (continuous) resolve(child);
    });
  }
  const libraryRequire = createRequire(path.join(root, 'library/package.json'));
  const rslib = path.join(
    path.dirname(libraryRequire.resolve('@rslib/core/package.json')),
    'bin/rslib.js',
  );
  async function wait(url, json = false) {
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      if (failures.length) throw new Error(failures.join('\n'));
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(4000),
        });
        if (response.ok) {
          if (json) await response.json();
          else await response.text();
          return;
        }
      } catch {}
      await sleep(200);
    }
    throw new Error(
      `Readiness timed out: ${url}\n${[...logs].map(([key, log]) => `${key}:\n${log}`).join('\n')}`,
    );
  }
  async function serveArtifacts(name, output, port) {
    const dir = path.join(root, name, output);
    const server = createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      try {
        const filename = path.resolve(
          dir,
          `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`,
        );
        if (
          !filename.startsWith(`${dir}${path.sep}`) ||
          !(await stat(filename)).isFile()
        ) {
          res.writeHead(404).end();
          return;
        }
        res.setHeader(
          'Content-Type',
          filename.endsWith('.json')
            ? 'application/json'
            : filename.endsWith('.css')
              ? 'text/css'
              : filename.endsWith('.svg')
                ? 'image/svg+xml'
                : 'text/javascript',
        );
        createReadStream(filename).pipe(res);
      } catch {
        res.writeHead(404).end();
      }
    });
    servers.push(server);
    await new Promise(resolve => server.listen(port, resolve));
  }
  async function stop() {
    await Promise.all(
      servers.map(
        server =>
          new Promise(resolve => {
            server.closeAllConnections();
            server.close(resolve);
          }),
      ),
    );
    await Promise.all(
      processes
        .filter(child => child.exitCode === null && child.signalCode === null)
        .map(
          child =>
            new Promise(resolve =>
              treeKill(child.pid, 'SIGTERM', () => resolve()),
            ),
        ),
    );
  }
  try {
    for (const version of ['v1', 'v2']) {
      // Library builds are deterministic and serve the same emitted files in both modes.
      await launch('library', [rslib, 'build'], version);
      await serveArtifacts(
        'library',
        version === 'v2' ? 'dist/v2' : 'dist/v1',
        version === 'v2' ? ports.libraryV2 : ports.library,
      );
    }
    await launch('provider', [modern, 'build'], 'v2');
    await serveArtifacts('provider', 'dist-v2', ports.providerV2);
    for (const [name, version, key] of [
      ['provider', 'v1', 'provider'],
      ['nested', 'v1', 'nested'],
      ['host', 'v1', 'host'],
    ]) {
      if (mode === 'production') await launch(name, [modern, 'build'], version);
      await launch(
        name,
        [modern, mode === 'production' ? 'serve' : 'dev'],
        version,
        true,
      );
      await wait(
        `http://localhost:${ports[key]}/${name === 'host' ? 'static' : 'static/mf-manifest.json'}`,
        name !== 'host',
      );
    }
    await wait(`http://localhost:${ports.host}/static`);
    return { ports, url: `http://localhost:${ports.host}`, stop, logs };
  } catch (error) {
    await stop();
    throw error;
  }
}
