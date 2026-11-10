import { spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import getPort from 'get-port';
import treeKill from 'tree-kill';
import { createResponseGate } from './response-gate.mjs';
const fixtureRoot = fileURLToPath(new URL('../', import.meta.url));
const names = [
  'host',
  'provider',
  'nested',
  'library',
  'providerV2',
  'libraryV2',
  'api',
  'hostInternal',
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function startLab(
  mode = 'dev',
  fixedPorts = false,
  root = fixtureRoot,
  hostBase = '',
) {
  const hostRequire = createRequire(path.join(root, 'host/package.json'));
  const modern = path.resolve(
    path.dirname(hostRequire.resolve('@modern-js/app-tools')),
    '../../bin/modern.js',
  );
  /** @type {Record<string, number>} */
  const ports = {};
  const portRangeStart = 12000 + Math.floor(Math.random() * 8000);
  for (const [index, name] of names.entries()) {
    ports[name] = fixedPorts
      ? 4300 + index
      : await getPort({
          // Ephemeral client connections can claim port-0 allocations before
          // the later dev servers bind. Keep fixture listeners below that range.
          port: getPort.makeRange(portRangeStart, 25000),
          exclude: Object.values(ports),
        });
  }
  const processes = [];
  const servers = [];
  const failures = [];
  let stopping = false;
  const logs = new Map();
  /** @type {{ probe: string; path: string; completed: boolean; aborted: boolean }[]} */
  const routeRequests = [];
  /** @type {{ probe: string; completed: boolean; aborted: boolean; marker?: string }[]} */
  const bridgeRequests = [];
  /** @type {string[]} */
  const weatherRequests = [];
  const bridgeGates = new Map();
  const pendingOutlooks = new Map();
  const releasedBridgeGates = new Set();
  const documentGates = new Map();
  const responseGates = new Set();
  const bridgeResults = new Map();
  // These controls belong to one exact document/request sequence, and are
  // registered by tests only. Public routes and cancellation are unchanged.
  const gateDocument = pathname => {
    const gate = createResponseGate();
    documentGates.set(pathname, gate);
    responseGates.add(gate);
    return gate;
  };
  const queueBridgeResults = (probe, markers) => {
    bridgeResults.set(probe, [...markers]);
    return () => bridgeResults.delete(probe);
  };
  const releaseBridge = probe => {
    releasedBridgeGates.add(probe);
    bridgeGates.get(probe)?.();
    bridgeGates.delete(probe);
  };
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
        if (continuous && !stopping) {
          const failure = `${key} exited (code: ${code}, signal: ${signal})\n${logs.get(key)}`;
          failures.push(failure);
          console.error(failure);
        }
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
    let lastResponse;
    while (Date.now() < deadline) {
      if (failures.length) throw new Error(failures.join('\n'));
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(4000),
        });
        const body = await response.text();
        lastResponse = {
          status: response.status,
          type: response.headers.get('content-type'),
          body: body.slice(0, 300),
        };
        if (response.ok) {
          if (json) JSON.parse(body);
          return;
        }
      } catch (error) {
        lastResponse = { ...lastResponse, error: String(error) };
      }
      await sleep(200);
    }
    throw new Error(
      `Readiness timed out: ${url}\nLast response: ${JSON.stringify(lastResponse)}\n${[...logs].map(([key, log]) => `${key}:\n${log}`).join('\n')}`,
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
    stopping = true;
    for (const gate of responseGates) gate.dispose();
    responseGates.clear();
    documentGates.clear();
    bridgeResults.clear();
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
    const gateway = createServer(async (req, res) => {
      if (req.url.startsWith('/_lab/offline/')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');
        res
          .writeHead(503, { 'Content-Type': 'application/json' })
          .end(JSON.stringify({ error: 'LAB_REMOTE_OFFLINE' }));
        return;
      }
      const referer = req.headers.referer;
      if (
        referer &&
        /\/static\/js\/index(?:\.[\w]+)?\.js$/.test(
          new URL(req.url, 'http://localhost').pathname,
        )
      ) {
        const frame = new URL(referer);
        if (frame.pathname === '/weather') {
          const delay = Math.min(
            3000,
            Math.max(0, Number(frame.searchParams.get('delay')) || 0),
          );
          await sleep(delay);
          res.setHeader('x-lab-script-delay', String(delay));
        }
      }
      if (res.destroyed) return;
      const upstream = request(
        {
          hostname: 'localhost',
          port: ports.hostInternal,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        response => {
          res.writeHead(response.statusCode, {
            ...response.headers,
            ...(/\/static\/js\/index(?:\.[\w]+)?\.js$/.test(
              new URL(req.url, 'http://localhost').pathname,
            )
              ? { 'cache-control': 'no-store' }
              : {}),
          });
          const gate = documentGates.get(req.url);
          if (gate) {
            documentGates.delete(req.url);
            gate.pipe(response, res);
          } else response.pipe(res);
        },
      );
      upstream.on('error', error => {
        if (!res.destroyed)
          console.error(`MF gateway failed: ${req.url}`, error);
        if (!res.headersSent) res.writeHead(502);
        res.end();
      });
      res.on('close', () => upstream.destroy());
      req.pipe(upstream);
    });
    servers.push(gateway);
    await new Promise(resolve => gateway.listen(ports.host, resolve));
    let requestId = 0;
    const api = createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/bridge-data/cancel' && req.method === 'POST') {
        pendingOutlooks.get(url.searchParams.get('token'))?.();
        res.writeHead(204).end();
        return;
      }
      if (url.pathname === '/bridge-weather') {
        const kind = url.searchParams.get('kind') || '';
        const bulletins = {
          current: { temperature: 24, condition: 'Mostly sunny' },
          forecast: {
            days: [
              {
                day: 'Today',
                condition: 'Mostly sunny',
                high: 26,
                low: 18,
                rain: '10%',
              },
              {
                day: 'Tue',
                condition: 'Cloudy',
                high: 24,
                low: 17,
                rain: '20%',
              },
              {
                day: 'Wed',
                condition: 'Light rain',
                high: 21,
                low: 16,
                rain: '80%',
              },
              {
                day: 'Thu',
                condition: 'Sunny spells',
                high: 23,
                low: 16,
                rain: '15%',
              },
              {
                day: 'Fri',
                condition: 'Clear skies',
                high: 25,
                low: 18,
                rain: '5%',
              },
            ],
          },
          air: { aqi: 32 },
        };
        if (!Object.hasOwn(bulletins, kind)) {
          res.writeHead(404).end();
          return;
        }
        weatherRequests.push(kind);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...bulletins[kind], updatedAt: '10:30 CST' }));
        return;
      }
      if (url.pathname === '/bridge-data') {
        const probe = url.searchParams.get('probe') || '';
        const markers = bridgeResults.get(probe);
        const marker = markers?.shift();
        if (markers && !markers.length) bridgeResults.delete(probe);
        const cancelToken = url.searchParams.get('cancelToken');
        if (cancelToken) pendingOutlooks.set(cancelToken, () => res.destroy());
        const record = {
          probe,
          completed: false,
          aborted: false,
          ...(marker ? { marker } : {}),
        };
        bridgeRequests.push(record);
        res.on('close', () => {
          if (cancelToken) pendingOutlooks.delete(cancelToken);
          if (!res.writableFinished) record.aborted = true;
          bridgeGates.get(probe)?.();
          bridgeGates.delete(probe);
        });
        if (url.searchParams.has('hold') && !releasedBridgeGates.has(probe)) {
          await new Promise(resolve => bridgeGates.set(probe, resolve));
        }
        const delay = Math.min(
          5000,
          Math.max(0, Number(url.searchParams.get('delay')) || 0),
        );
        if (delay)
          await new Promise(resolve => {
            const timer = setTimeout(resolve, delay);
            res.once('close', () => {
              clearTimeout(timer);
              resolve();
            });
          });
        if (res.destroyed) return;
        record.completed = true;
        if (url.searchParams.get('failure') === 'data') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Detailed outlook unavailable' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            detail: `Resolved ${marker || probe}`,
            ...(url.searchParams.has('day')
              ? {
                  outlook: ['wed', 'fri'].includes(url.searchParams.get('day'))
                    ? 'Bring an umbrella for showers. Plan a short walk between rain spells.'
                    : 'A good day for a lakeside walk. Bring sun protection and a light layer for the evening.',
                }
              : {}),
          }),
        );
        return;
      }
      if (url.pathname === '/route-loader') {
        const record = {
          probe: url.searchParams.get('probe') || '',
          path: url.searchParams.get('path') || '',
          completed: false,
          aborted: false,
        };
        routeRequests.push(record);
        res.on('close', () => {
          if (!res.writableFinished) record.aborted = true;
        });
        await sleep(250);
        if (res.destroyed) return;
        record.completed = true;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ path: record.path }));
        return;
      }
      if (url.pathname !== '/weather') {
        res.writeHead(404).end();
        return;
      }
      if (url.searchParams.get('failure') === 'data') {
        res
          .writeHead(503, { 'Content-Type': 'application/json' })
          .end(JSON.stringify({ error: 'Weather service unavailable' }));
        return;
      }
      if (url.searchParams.get('failure') === 'invalid') {
        res
          .writeHead(200, { 'Content-Type': 'application/json' })
          .end(JSON.stringify({ temperature: null }));
        return;
      }
      const id = ++requestId;
      await sleep(900);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          temperature: 30,
          condition: 'Partly cloudy',
          source: 'Local weather API',
          requestId: id,
        }),
      );
    });
    servers.push(api);
    await new Promise(resolve => api.listen(ports.api, resolve));
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
      // Probe the Host listener directly before checking the public gateway.
      ['host', 'v1', 'hostInternal'],
    ]) {
      if (mode === 'production') await launch(name, [modern, 'build'], version);
      await launch(
        name,
        [modern, mode === 'production' ? 'serve' : 'dev'],
        version,
        true,
      );
      await wait(
        `http://localhost:${ports[key]}/${name === 'host' ? hostBase.replace(/^\//, '') : 'static/mf-manifest.json'}`,
        name !== 'host',
      );
    }
    await wait(`http://localhost:${ports.host}${hostBase}/`);
    return {
      ports,
      url: `http://localhost:${ports.host}`,
      stop,
      logs,
      routeRequests,
      bridgeRequests,
      weatherRequests,
      releaseBridge,
      gateDocument,
      queueBridgeResults,
    };
  } catch (error) {
    await stop();
    throw error;
  }
}
