import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
const [a, b, out, repoA, repoB] = process.argv.slice(2);
if (!a || !b || !out || !repoA || !repoB)
  throw Error(
    'Usage: node paired.mjs BASE_OUTPUT HEAD_OUTPUT OUTPUT BASE_REPO HEAD_REPO',
  );
await mkdir(out, { recursive: true });
const repos = new Map([
  [a, repoA],
  [b, repoB],
]);
const require = createRequire(
  path.join(repoA, 'tests/integration/module-federation/package.json'),
);
const treeKill = require('tree-kill');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const active = [];
const reverseLaunch = process.env.PAIRED_LAUNCH_ORDER === 'BA';
const warmupPairs = Number(process.env.PAIRED_WARMUP_PAIRS || 50);
if (!Number.isSafeInteger(warmupPairs) || warmupPairs < 1)
  throw Error('Warmup pairs must be a positive integer');
const measuredConcurrency = Number(
  process.env.PAIRED_MEASURED_CONCURRENCY || 16,
);
if (![1, 16].includes(measuredConcurrency))
  throw Error('Measured concurrency must be 1 or 16');
const claimedPorts = new Set();
const result = {
  metadata: {
    protocol: 'paired-fixed-artifacts-v2-launch-order',
    launchOrder: reverseLaunch ? 'BA' : 'AB',
    warmupPairs,
    serverLogLevel: process.env.MODERN_SERVER_LOG_LEVEL || 'verbose',
    measuredPairs: 100,
    concurrency: measuredConcurrency,
    warmupConcurrency: 16,
    node: process.version,
    start: new Date().toISOString(),
    startLoad: os.loadavg(),
    a: JSON.parse(await readFile(path.join(a, 'results.json'), 'utf8'))
      .metadata,
    b: JSON.parse(await readFile(path.join(b, 'results.json'), 'utf8'))
      .metadata,
    harnessSha256: createHash('sha256')
      .update(await readFile(import.meta.filename))
      .digest('hex'),
  },
  scenarios: {},
};
const persist = () =>
  writeFile(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
async function stop(c) {
  if (c?.pid && c.exitCode === null)
    await new Promise(r => treeKill(c.pid, 'SIGTERM', r));
}
async function wait(url) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await r.text();
      if (r.ok) return;
    } catch {}
    await sleep(100);
  }
  throw Error('not ready ' + url);
}
async function ordinary(root, mode) {
  const dir = path.join(root, 'ordinary-' + mode),
    r = createRequire(path.join(dir, 'package.json')),
    modern = path.resolve(
      path.dirname(r.resolve('@modern-js/app-tools')),
      '../../bin/modern.js',
    ),
    config = await readFile(path.join(dir, 'modern.config.ts'), 'utf8'),
    port = Number(config.match(/server:\{port:(\d+)/)[1]);
  const c = spawn(process.execPath, [modern, 'serve'], {
    cwd: dir,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  active.push(c);
  let log = '';
  c.stdout.on('data', x => (log += x));
  c.stderr.on('data', x => (log += x));
  const url = 'http://localhost:' + port + '/';
  await wait(url);
  return {
    url,
    stop: async () => {
      await stop(c);
      await writeFile(
        path.join(out, path.basename(root) + '-' + mode + '.log'),
        log,
      );
    },
  };
}
async function lab(root) {
  const dir = path.join(root, 'lab'),
    r = createRequire(
      path.join(
        repos.get(root),
        'tests/integration/module-federation/package.json',
      ),
    );
  const original = path.join(
    repos.get(root),
    'tests/integration/module-federation/scripts/lab.mjs',
  );
  let source = await readFile(original, 'utf8');
  source = source
    .replace(
      "import getPort from 'get-port';",
      'import getPort from ' + JSON.stringify(r.resolve('get-port')) + ';',
    )
    .replace(
      "import treeKill from 'tree-kill';",
      'import treeKill from ' + JSON.stringify(r.resolve('tree-kill')) + ';',
    );
  source = source.replace(
    "  hostBase = '',\n)",
    "  hostBase = '',\n  suppliedPorts,\n)",
  );
  const begin = source.indexOf('  const portRangeStart ='),
    end = source.indexOf('  const processes =', begin);
  source =
    source.slice(0, begin) +
    '  Object.assign(ports,suppliedPorts);\n' +
    source.slice(end);
  source = source
    .replace("      await launch('library', [rslib, 'build'], version);", '')
    .replace("    await launch('provider', [modern, 'build'], 'v2');", '')
    .replace(
      "      if (mode === 'production') await launch(name, [modern, 'build'], version);",
      '',
    );
  const file = path.join(out, path.basename(root) + '-lab-reuse.mjs');
  await writeFile(file, source);
  const log = await readFile(path.join(root, 'lab-host-v1.log'), 'utf8');
  const internal = Number(log.match(/Local:\s+http:\/\/localhost:(\d+)/)[1]);
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
  const ports = Object.fromEntries(names.map((n, i) => [n, internal - 7 + i]));
  for (const n of ['provider', 'nested']) {
    const x = await readFile(path.join(root, 'lab-' + n + '-v1.log'), 'utf8');
    if (Number(x.match(/Local:\s+http:\/\/localhost:(\d+)/)[1]) !== ports[n])
      throw Error('noncontiguous recorded ports');
  }
  for (const port of Object.values(ports)) {
    if (claimedPorts.has(port))
      throw Error('Paired fixture ports must be distinct');
    claimedPorts.add(port);
  }
  result.metadata[path.basename(root) + 'Ports'] = ports;
  const mod = await import(file);
  return await mod.startLab('production', false, dir, '', ports);
}
function bridgeFrames(body) {
  return [
    ...body.matchAll(
      /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
    ),
  ].map(match => JSON.parse(match[1]));
}
function bridgeHTML(body) {
  const streams = new Map();
  for (const [id, frame] of bridgeFrames(body))
    if (frame.type === 'html')
      streams.set(id, (streams.get(id) || '') + frame.html);
  return [...streams.values()];
}
function hasApplicationHTML(body) {
  return (
    /<main[^>]*data-testid=["']ordinary-app["'][^>]*>/.test(body) ||
    bridgeHTML(body).some(html =>
      /<section[^>]*data-testid="scope-product-list"[^>]*>/.test(html),
    )
  );
}
async function http(url) {
  const start = performance.now();
  const response = await fetch(url);
  const headers = performance.now();
  const reader = response.body.getReader();
  let first,
    applicationFirst,
    body = '';
  const decoder = new TextDecoder();
  while (true) {
    const part = await reader.read();
    const arrived = performance.now();
    if (part.done) break;
    first ??= arrived;
    body += decoder.decode(part.value, { stream: true });
    if (applicationFirst === undefined && hasApplicationHTML(body))
      applicationFirst = arrived;
  }
  return {
    status: response.status,
    headers: headers - start,
    ttfb: (first || headers) - start,
    applicationFirst:
      applicationFirst === undefined ? undefined : applicationFirst - start,
    total: performance.now() - start,
    bytes: Buffer.byteLength(body),
    body,
  };
}
async function measure(urlA, urlB, assertHTML, key) {
  if (urlA === urlB) throw Error('Paired fixture URLs must be distinct');
  for (const [label, url] of [
    ['A', urlA],
    ['B', urlB],
  ]) {
    const r = await http(url);
    assertHTML(r.body);
    await writeFile(path.join(out, key + '-' + label + '.html'), r.body);
  }
  async function burst(url, concurrency) {
    const start = performance.now();
    const v = await Promise.all(
      Array.from({ length: concurrency }, () => http(url)),
    );
    const elapsed = performance.now() - start;
    v.forEach(x => assertHTML(x.body));
    return {
      elapsed,
      ttfb: v.map(x => x.ttfb),
      applicationFirst: v.map(x => x.applicationFirst),
      total: v.map(x => x.total),
      bytes: v.map(x => x.bytes),
    };
  }
  const warmup = [],
    measured = [];
  for (const [count, rows] of [
    [warmupPairs, warmup],
    [100, measured],
  ])
    for (let i = 0; i < count; i++) {
      const order = i % 2 ? ['B', 'A'] : ['A', 'B'];
      const row = { order };
      for (const label of order)
        row[label] = await burst(
          label === 'A' ? urlA : urlB,
          rows === warmup ? 16 : measuredConcurrency,
        );
      rows.push(row);
    }
  return { warmup, measured };
}
try {
  for (const mode of ['csr', 'string', 'stream']) {
    console.log(mode);
    let A, B;
    try {
      if (reverseLaunch) {
        B = await ordinary(b, mode);
        A = await ordinary(a, mode);
      } else {
        A = await ordinary(a, mode);
        B = await ordinary(b, mode);
      }
      result.scenarios[mode] = await measure(
        A.url,
        B.url,
        html => {
          if (
            (mode !== 'csr') !==
            /<main[^>]*data-testid="ordinary-app"[^>]*>/.test(html)
          )
            throw Error('SSR failed');
        },
        mode,
      );
      await persist();
    } finally {
      await A?.stop();
      await B?.stop();
    }
  }
  let A, B;
  try {
    if (reverseLaunch) {
      B = await lab(b);
      A = await lab(a);
    } else {
      A = await lab(a);
      B = await lab(b);
    }
    for (const count of [1, 8]) {
      console.log('bridge' + count);
      result.scenarios['bridge' + count] = await measure(
        A.url + '/perf-bridge?count=' + count,
        B.url + '/perf-bridge?count=' + count,
        body => {
          const frames = bridgeFrames(body),
            html = bridgeHTML(body),
            sections = html.map(
              value =>
                (
                  value.match(
                    /<section[^>]*data-testid="scope-product-list"[^>]*>/g,
                  ) || []
                ).length,
            );
          if (
            sections.length !== count ||
            sections.some(x => x !== 1) ||
            frames.filter(([, f]) => f.type === 'done').length !== count ||
            frames.filter(([, f]) => f.type === 'ready').length !== count ||
            frames.some(([, f]) => f.type === 'error' || f.type === 'data')
          )
            throw Error('Bridge actual HTML frames failed');
        },
        'bridge' + count,
      );
      await persist();
    }
  } finally {
    await A?.stop();
    await B?.stop();
  }
} finally {
  for (const c of active) await stop(c);
  result.metadata.end = new Date().toISOString();
  result.metadata.endLoad = os.loadavg();
  await persist();
}
