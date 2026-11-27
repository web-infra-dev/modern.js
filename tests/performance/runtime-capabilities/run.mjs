import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  symlink,
  cp,
} from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
const [repo, out, only = 'all'] = process.argv.slice(2);
const concurrentWarmup = Number(process.env.PERF_CONCURRENT_WARMUP || 0),
  concurrentRounds = Number(process.env.PERF_CONCURRENT_ROUNDS || 5),
  skipBrowser = process.env.PERF_SKIP_BROWSER === '1';
if (!repo || !out)
  throw Error('Usage: node --expose-gc run.mjs REPO OUT [all|ordinary|bridge]');
await mkdir(out, { recursive: true });
const labSource = path.join(repo, 'tests/integration/module-federation');
const require = createRequire(path.join(labSource, 'package.json'));
const puppeteer = require('puppeteer');
const getPort = require('get-port');
const treeKill = require('tree-kill');
const { startLab } = await import(path.join(labSource, 'scripts/lab.mjs'));
const modern = path.resolve(
  path.dirname(require.resolve('@modern-js/app-tools')),
  '../../bin/modern.js',
);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const result = {
  metadata: {
    sha: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim(),
    lockSha256: createHash('sha256')
      .update(await readFile(path.join(repo, 'pnpm-lock.yaml')))
      .digest('hex'),
    node: process.version,
    pnpm: execFileSync('pnpm', ['--version'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim(),
    platform: process.platform,
    arch: process.arch,
    cpu: os.cpus()[0].model,
    startedAt: new Date().toISOString(),
    startLoadAverage: os.loadavg(),
    startFreeMemory: os.freemem(),
    startProcesses: execFileSync('ps', ['-axo', 'pid,ppid,pcpu,rss,comm'], {
      encoding: 'utf8',
    }),
    build:
      'NODE_ENV=production, buildCache=false, default minification, stats modules enabled',
    samples: 9,
    warmup: 2,
    concurrentWarmup,
    concurrentRounds,
    skipBrowser,
  },
  scenarios: {},
};
result.metadata.protocolVersion = 'actual-html-frames-v5-warmup-recording';
result.metadata.harnessSha256 = createHash('sha256')
  .update(await readFile(new URL(import.meta.url)))
  .digest('hex');
const persist = () =>
  writeFile(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
await persist();
const patch = execFileSync('git', ['diff', '--binary', 'HEAD'], { cwd: repo });
await writeFile(path.join(out, 'source.diff'), patch);
const sourceFiles = execFileSync(
  'git',
  [
    'ls-files',
    '-co',
    '--exclude-standard',
    'packages/runtime/plugin-runtime',
    'packages/runtime/plugin-i18n',
    'packages/toolkit/plugin',
    'packages/solutions/app-tools',
  ],
  { cwd: repo, encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .sort();
const treeHash = createHash('sha256');
for (const file of sourceFiles) {
  try {
    treeHash.update(file);
    treeHash.update(await readFile(path.join(repo, file)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    treeHash.update('DELETED');
  }
}
result.metadata.sourceSha256 = treeHash.digest('hex');
result.metadata.patchSha256 = createHash('sha256').update(patch).digest('hex');
await persist();
const distHash = createHash('sha256');
for (const name of [
  'runtime/plugin-runtime',
  'runtime/plugin-i18n',
  'toolkit/plugin',
  'solutions/app-tools',
]) {
  const folder = path.join(repo, 'packages', name, 'dist');
  for (const file of (await readdir(folder, { recursive: true })).sort()) {
    try {
      const bytes = await readFile(path.join(folder, file));
      distHash.update(name + '/' + file);
      distHash.update(bytes);
    } catch (error) {
      if (error.code !== 'EISDIR') throw error;
    }
  }
}
result.metadata.distSha256 = distHash.digest('hex');
result.metadata.distCommit =
  process.env.PERF_DIST_COMMIT || result.metadata.sha;
result.metadata.sourceEqualsDist = patch.length === 0;
await persist();
async function linkDependencies(source, target) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source)) {
    if (entry.startsWith('.') && !['.bin', '.pnpm'].includes(entry)) continue;
    await symlink(path.join(source, entry), path.join(target, entry), 'dir');
  }
}
const statsPlugin = `
class PerfStats { apply(compiler: any) { compiler.hooks.done.tap('PerfStats', (stats: any) => { const fs = require('node:fs'); fs.writeFileSync('stats-' + (compiler.options.name || compiler.options.target || 'build') + '.json', JSON.stringify(stats.toJson({ all: false, assets: true, modules: true, nestedModules: true, orphanModules: true, chunkModules: true, chunks: true, modulesSpace: Infinity, nestedModulesSpace: Infinity, groupModulesByAttributes: false, groupModulesByCacheStatus: false, groupModulesByExtension: false, groupModulesByLayer: false, groupModulesByPath: false, groupModulesByType: false }))); }); } }
`;
const observer = `import { useEffect } from 'react';
import { defineRuntimeConfig, type RuntimePlugin } from '@modern-js/runtime';
const observer = (): RuntimePlugin => ({ name: 'perf-observer', setup(api) {
 const started = performance.now();
 if (typeof window !== 'undefined') { const p=(window as any).__perf ||= {ready:[],committed:[],livePages:0,cleaned:0,setup:[],before:[]}; p.setup.push(started); }
 api.onBeforeRender(() => { if (typeof window !== 'undefined') (window as any).__perf.before.push(performance.now()); });
 api.wrapRoot(App => function PerfRoot(props) { useEffect(() => {const p=(window as any).__perf; p.ready.push(performance.now()); p.active=(p.active||0)+1; return ()=>{p.cleaned++;p.active--;};}, []); return <App {...props}/>; });
}});
export default defineRuntimeConfig({plugins:[observer()]});
`;
async function build(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [modern, 'build'], {
      cwd,
      env: { ...process.env, NODE_ENV: 'production', NODE_PATH: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    child.stdout.on('data', x => (log += x));
    child.stderr.on('data', x => (log += x));
    child.on('exit', async code => {
      await writeFile(path.join(cwd, 'build.log'), log);
      code === 0 ? resolve() : reject(Error(log));
    });
    child.on('error', reject);
  });
}
async function wait(url) {
  for (let i = 0; i < 150; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await r.text();
      if (r.ok) return;
    } catch {}
    await sleep(100);
  }
  throw Error('Server not ready: ' + url);
}
async function stop(child) {
  if (child?.pid && child.exitCode === null)
    await new Promise(resolve => treeKill(child.pid, 'SIGTERM', resolve));
}
function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted.at(-1),
    p95: sorted[Math.floor((sorted.length - 1) * 0.95)],
  };
}
function isServerArtifact(file) {
  return ['bundles/', 'server/', 'v1/ssr/', 'v2/ssr/'].some(prefix =>
    file.startsWith(prefix),
  );
}
async function artifacts(directory) {
  const files = await readdir(directory, { recursive: true });
  const rows = [];
  for (const file of files.filter(f => /\.(m?js|css)$/.test(f))) {
    const bytes = await readFile(path.join(directory, file));
    rows.push({
      file,
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
      bridge:
        /__MF_BRIDGE_SSR__|BridgeSSRContext|module-federation\/bridge-ssr\/producer/.test(
          bytes.toString(),
        ),
      node: /require\(["']node:/.test(bytes.toString()),
    });
  }
  return {
    files: rows,
    browser: rows
      .filter(r => !isServerArtifact(r.file))
      .reduce((a, r) => ({ raw: a.raw + r.raw, gzip: a.gzip + r.gzip }), {
        raw: 0,
        gzip: 0,
      }),
    server: rows
      .filter(r => isServerArtifact(r.file))
      .reduce((a, r) => ({ raw: a.raw + r.raw, gzip: a.gzip + r.gzip }), {
        raw: 0,
        gzip: 0,
      }),
  };
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
function serverRss() {
  const rows = execFileSync('ps', ['-axo', 'pid,ppid,rss,comm'], {
    encoding: 'utf8',
  })
    .split('\n')
    .flatMap(line => {
      const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/);
      return m
        ? [{ pid: +m[1], parent: +m[2], rssKB: +m[3], command: m[4] }]
        : [];
    });
  const owned = new Set([process.pid]);
  for (let i = 0; i < 6; i++)
    for (const r of rows) if (owned.has(r.parent)) owned.add(r.pid);
  return rows.filter(
    r => r.pid !== process.pid && owned.has(r.pid) && /node$/.test(r.command),
  );
}
let htmlEvidence = 0;
async function measureHttp(url, assertHTML) {
  const rssBefore = serverRss();
  const rows = [];
  for (let i = 0; i < 11; i++) {
    const r = await http(url);
    if (i === 0)
      await writeFile(
        path.join(out, 'raw-html-' + htmlEvidence++ + '.html'),
        r.body,
      );
    assertHTML(r.body);
    if (i >= 2) {
      delete r.body;
      rows.push(r);
    }
  }
  const profilePids = process.env.PERF_PROFILE_DIR
    ? serverRss().map(x => x.pid)
    : [];
  for (const pid of profilePids) process.kill(pid, 'SIGUSR2');
  if (profilePids.length) await sleep(200);
  const concurrent = [],
    concurrentWarmupSamples = [];
  for (let warmup = 0; warmup < concurrentWarmup; warmup++) {
    const start = performance.now();
    const values = await Promise.all(
      Array.from({ length: 16 }, () => http(url)),
    );
    const elapsed = performance.now() - start;
    values.forEach(x => assertHTML(x.body));
    concurrentWarmupSamples.push({
      elapsed,
      ttfb: values.map(x => x.ttfb),
      applicationFirst: values.map(x => x.applicationFirst),
      total: values.map(x => x.total),
    });
  }
  for (let round = 0; round < concurrentRounds; round++) {
    const start = performance.now();
    const values = await Promise.all(
      Array.from({ length: 16 }, () => http(url)),
    );
    const elapsed = performance.now() - start;
    values.forEach(x => assertHTML(x.body));
    concurrent.push({
      elapsed,
      ttfb: values.map(x => x.ttfb),
      applicationFirst: values.map(x => x.applicationFirst),
      total: values.map(x => x.total),
      bytes: values.map(x => x.bytes),
    });
  }
  for (const pid of profilePids) process.kill(pid, 'SIGUSR2');
  if (profilePids.length) await sleep(400);
  return {
    rssBefore,
    rssAfter: serverRss(),
    samples: rows,
    medianTTFB: summarize(rows.map(x => x.ttfb)),
    concurrent16: concurrent,
    concurrentWarmupSamples,
  };
}
let browser;
async function measureBrowser(url, count, toggle) {
  if (skipBrowser) return { skipped: true };
  const samples = [];
  for (let i = 0; i < 11; i++) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.evaluateOnNewDocument(() => {
      window.__perf = {
        ready: [],
        committed: [],
        livePages: 0,
        cleaned: 0,
        setup: [],
        before: [],
      };
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      n => window.__perf?.committed.length >= n,
      {},
      count === 1 ? 1 : count - 1,
    );
    const timing = await page.evaluate(() => ({
      setup: window.__perf.setup,
      before: window.__perf.before,
      ready: window.__perf.ready,
      committed: window.__perf.committed,
      navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
      resources: performance.getEntriesByType('resource').map(x => x.toJSON()),
      active: window.__perf.active,
    }));
    if (errors.length) throw Error(errors.join('\n'));
    if (i >= 2) samples.push(timing);
    await page.close();
  }
  const page = await browser.newPage();
  const resourceErrors = [];
  page.on('pageerror', error => resourceErrors.push(String(error)));
  await page.evaluateOnNewDocument(() => {
    window.__perf = {
      ready: [],
      committed: [],
      livePages: 0,
      cleaned: 0,
      setup: [],
      before: [],
    };
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    n => window.__perf?.committed.length >= n,
    {},
    count === 1 ? 1 : count - 1,
  );
  const cdp = await page.createCDPSession();
  async function memory() {
    await cdp.send('HeapProfiler.collectGarbage');
    const counters = await cdp.send('Memory.getDOMCounters');
    const metrics = await page.metrics();
    return {
      ...counters,
      JSHeapUsedSize: metrics.JSHeapUsedSize,
      JSHeapTotalSize: metrics.JSHeapTotalSize,
      ...(await page.evaluate(() => ({
        active: window.__perf.active,
        cleaned: window.__perf.cleaned,
      }))),
    };
  }
  const resources = { mounted: await memory(), cycles: [] };
  if (toggle) {
    for (let i = 0; i < 10; i++) {
      await page.click(toggle);
      await page.waitForFunction(() => window.__perf.active === 1);
      const unmounted = await memory();
      await page.click(toggle);
      await page.waitForFunction(
        n => window.__perf.active === n && window.__perf.livePages === n - 1,
        {},
        count,
      );
      resources.cycles.push({ unmounted, remounted: await memory() });
    }
    await page.click(toggle);
    await page.waitForFunction(() => window.__perf.active === 1);
    resources.afterUnmount = await memory();
  }
  if (resourceErrors.length) throw Error(resourceErrors.join('\n'));
  await page.close();
  return {
    samples,
    ready: summarize(samples.map(s => Math.max(...s.committed))),
    resources,
  };
}
try {
  if (!skipBrowser)
    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  if (browser) result.metadata.chrome = await browser.version();
  if (only === 'all' || only === 'ordinary')
    for (const mode of ['csr', 'string', 'stream']) {
      console.log('ordinary', mode);
      const dir = path.join(out, 'ordinary-' + mode);
      await mkdir(path.join(dir, 'src/routes'), { recursive: true });
      const source = path.join(repo, 'tests/integration/basic-app');
      await cp(
        path.join(source, 'package.json'),
        path.join(dir, 'package.json'),
      );
      await linkDependencies(
        path.join(source, 'node_modules'),
        path.join(dir, 'node_modules'),
      );
      const port = await getPort();
      await writeFile(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2021',
            module: 'ESNext',
            moduleResolution: 'bundler',
            jsx: 'react-jsx',
            esModuleInterop: true,
            skipLibCheck: true,
            noEmit: true,
          },
          include: ['src', 'modern.config.ts'],
        }),
      );
      await writeFile(
        path.join(dir, 'modern.config.ts'),
        `import { appTools, defineConfig } from '@modern-js/app-tools';\n${statsPlugin}\nexport default defineConfig({plugins:[appTools()],server:{port:${port},ssr:${mode === 'csr' ? 'false' : `{mode:'${mode}'}`}},performance:{buildCache:false},tools:{rspack(config){config.plugins.push(new PerfStats());}}});`,
      );
      await writeFile(
        path.join(dir, 'src/routes/layout.tsx'),
        `import { Outlet } from '@modern-js/runtime/router';export default function Layout(){return <Outlet/>}`,
      );
      await writeFile(
        path.join(dir, 'src/routes/page.tsx'),
        `import {useState,useEffect} from 'react';export default function Page(){useEffect(()=>{(window as any).__perf.committed.push(performance.now());},[]);const [count,setCount]=useState(0);return <main data-testid="ordinary-app"><h1>Ordinary React application</h1><button onClick={()=>setCount(count+1)}>Count: {count}</button></main>}`,
      );
      await writeFile(path.join(dir, 'src/modern.runtime.tsx'), observer);
      await build(dir);
      const child = spawn(process.execPath, [modern, 'serve'], {
        cwd: dir,
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let log = '';
      child.stdout.on('data', x => (log += x));
      child.stderr.on('data', x => (log += x));
      try {
        const url = `http://localhost:${port}/`;
        await wait(url);
        result.scenarios[mode] = {
          artifacts: await artifacts(path.join(dir, 'dist')),
          http: await measureHttp(url, html => {
            if (
              (mode !== 'csr') !==
              /<main[^>]*data-testid="ordinary-app"[^>]*>/.test(html)
            )
              throw Error('Raw SSR mismatch ' + mode);
            if (/__MF_BRIDGE_SSR__|BridgeSSRContext/.test(html))
              throw Error('Bridge leaked');
          }),
          browser: await measureBrowser(url, 1),
        };
        await persist();
      } finally {
        await stop(child);
        await writeFile(path.join(dir, 'server.log'), log);
      }
    }
  if (only === 'all' || only === 'bridge') {
    console.log('bridge lab');
    const labDir = path.join(out, 'lab');
    await mkdir(labDir, { recursive: true });
    const excluded = new Set([
      'node_modules',
      'dist',
      'dist-v2',
      '.modern-js',
      '.rsbuild',
    ]);
    await linkDependencies(
      path.join(repo, 'node_modules'),
      path.join(labDir, 'node_modules'),
    );
    await symlink(
      path.join(repo, 'tests/node_modules/typescript'),
      path.join(labDir, 'node_modules/typescript'),
      'dir',
    );
    for (const name of ['host', 'provider', 'nested', 'library']) {
      await cp(path.join(labSource, name), path.join(labDir, name), {
        recursive: true,
        filter: file => !excluded.has(path.basename(file)),
      });
      await linkDependencies(
        path.join(labSource, name, 'node_modules'),
        path.join(labDir, name, 'node_modules'),
      );
      if (name !== 'library') {
        const config = path.join(labDir, name, 'modern.config.ts');
        await writeFile(
          config,
          `${statsPlugin}\n${(await readFile(config, 'utf8')).replace(name === 'provider' ? 'config.plugins ||= [];' : 'plugins: [appTools()]', name === 'provider' ? 'config.plugins ||= []; config.plugins.push(new PerfStats());' : 'plugins: [appTools()], tools: { rspack(config) { config.plugins.push(new PerfStats()); } }')}`,
        );
      }
    }
    for (const file of ['ports.ts', 'package.json'])
      await cp(path.join(labSource, file), path.join(labDir, file));
    await writeFile(
      path.join(labDir, 'provider/src/modern.runtime.tsx'),
      observer,
    );
    const product = path.join(labDir, 'provider/src/routes/product/page.tsx');
    await writeFile(
      product,
      `import {useEffect} from 'react';\n${(await readFile(product, 'utf8')).replace('export default function ProductList() {', 'export default function ProductList() { useEffect(()=>{const p=(window as any).__perf; p.committed.push(performance.now());p.livePages++;return ()=>{p.livePages--;};},[]);')}`,
    );
    await writeFile(path.join(labDir, 'host/src/modern.runtime.tsx'), observer);
    await mkdir(path.join(labDir, 'host/src/routes/perf-bridge'), {
      recursive: true,
    });
    await writeFile(
      path.join(labDir, 'host/src/routes/perf-bridge/page.tsx'),
      `import {useState} from 'react';import {useLoaderData} from '@modern-js/runtime/router';import {createReactRemote} from '@modern-js/runtime/mf';import {loadRemote} from '@module-federation/enhanced/runtime';const Remote=createReactRemote({remote:()=>loadRemote('provider/ProductApp'),memoryRoute:{entryPath:'/'}});export default function Page(){const {count}=useLoaderData() as {count:number};const [show,setShow]=useState(true);return <main><button data-testid="perf-toggle" onClick={()=>setShow(!show)}>Toggle</button>{show&&Array.from({length:count},(_,i)=><Remote key={i} label={'Perf station '+i}/>)}</main>}`,
    );
    await writeFile(
      path.join(labDir, 'host/src/routes/perf-bridge/page.data.ts'),
      `export const loader=({request}:{request:Request})=>({count:Number(new URL(request.url).searchParams.get('count')||1)});`,
    );
    const lab = await startLab('production', false, labDir);
    try {
      result.labArtifacts = {};
      for (const name of ['host', 'provider', 'nested', 'library'])
        result.labArtifacts[name] = await artifacts(
          path.join(labDir, name, 'dist'),
        );
      for (const count of [1, 8]) {
        console.log('bridge', count);
        const url = lab.url + '/perf-bridge?count=' + count;
        result.scenarios['bridge' + count] = {
          http: await measureHttp(url, body => {
            const frames = bridgeFrames(body),
              html = bridgeHTML(body);
            const sections = html.map(
              value =>
                (
                  value.match(
                    /<section[^>]*data-testid="scope-product-list"[^>]*>/g,
                  ) || []
                ).length,
            );
            if (
              sections.length !== count ||
              sections.some(value => value !== 1) ||
              frames.filter(([, frame]) => frame.type === 'done').length !==
                count ||
              frames.filter(([, frame]) => frame.type === 'ready').length !==
                count ||
              frames.some(
                ([, frame]) => frame.type === 'error' || frame.type === 'data',
              )
            )
              throw Error(
                'Bridge raw SSR frames failed: expected ' +
                  count +
                  ' independent HTML streams, found sections ' +
                  sections,
              );
          }),
          browser: await measureBrowser(
            url,
            count + 1,
            '[data-testid="perf-toggle"]',
          ),
        };
        await persist();
      }
    } finally {
      await lab.stop();
      for (const [name, log] of lab.logs)
        await writeFile(path.join(out, 'lab-' + name + '.log'), log);
    }
  }
} finally {
  await browser?.close();
  result.metadata.finishedAt = new Date().toISOString();
  result.metadata.endLoadAverage = os.loadavg();
  result.metadata.endFreeMemory = os.freemem();
  await persist();
}
console.log('saved', path.join(out, 'results.json'));
