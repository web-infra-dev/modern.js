import { fingerprint } from './fingerprint.mjs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const [repo, out, variant] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const require = createRequire(
  path.join(repo, 'tests/integration/module-federation/package.json'),
);
const esbuild = require(
  path.join(repo, 'node_modules/.pnpm/node_modules/esbuild/lib/main.js'),
);
const puppeteer = require('puppeteer');
const fromSource = variant === 'head-source';
const runtime = path.join(
  repo,
  'packages/runtime/plugin-runtime',
  fromSource ? 'src' : 'dist/esm',
);
const file = (base, sourceExt) =>
  path.join(runtime, base + (fromSource ? sourceExt : '.mjs'));
const source = `
import React from 'react';
import {render} from ${JSON.stringify(file('core/browser/index', '.tsx'))};
import {createRuntime,${variant.startsWith('head') ? 'registerRuntimeDefinition' : 'registerPlugin'}} from ${JSON.stringify(file('core/plugin/index', '.ts'))};
import {setGlobalContext} from ${JSON.stringify(file('core/context/index', '.ts'))};
import {createApplication} from ${JSON.stringify(file('application/index', '.tsx'))};
import {APPLICATION_SNAPSHOT_PROTOCOL} from ${JSON.stringify(file('application/constants', '.ts'))};
const App=()=>React.createElement('button',null,'application');
const refs={contexts:[],payloads:[],snapshots:[]};window.__retained={refs,handles:[]};
const observer={name:'retention-observer',setup(api){api.onBeforeRender(context=>{const payload=Array.from({length:10240},(_,i)=>i);context.__retentionPayload=payload;refs.contexts.push(new WeakRef(context));if(context.initialData)refs.snapshots.push(new WeakRef(context.initialData));refs.payloads.push(new WeakRef(payload));});}};
${variant.startsWith('head') ? 'registerRuntimeDefinition((context,capabilities)=>createRuntime([observer],undefined,context,capabilities));' : 'registerPlugin([observer]);'}setGlobalContext({App});
const definition={App,routes:[],basename:'/',serverLoaders:false,selected:false,getDataBase:()=> 'http://localhost',createRuntime:(context,capabilities)=>createRuntime([observer],undefined,${variant.startsWith('head') ? 'context' : 'undefined'},capabilities)};
window.runRetained=async(kind,count)=>{for(let i=0;i<count;i++){const container=document.createElement('div');document.body.appendChild(container);if(kind==='ordinary'){const root=await render(React.createElement(App),container);await new Promise(requestAnimationFrame);root.unmount();window.__retained.handles.push(root);}else{const app=createApplication(undefined,{definition});if(kind==='bridge-hydrate'){const shellMarker='probe-'+i;container.innerHTML='<button>application</button><template id="'+shellMarker+'"></template>';const node=container.firstChild;await app.hydrate(container,{protocol:APPLICATION_SNAPSHOT_PROTOCOL,reactVersion:React.version,identifierPrefix:shellMarker,shellMarker,url:'http://localhost/',basename:'/',memoryRoute:{entryPath:'/'},props:{},initialData:{large:Array.from({length:10240},(_,j)=>j),later:null},pending:[{id:'later',path:['initialData','later']}]},{updates:new ReadableStream(),memoryRoute:{entryPath:'/'},onRecoverableError:error=>{throw error;}});if(container.firstChild!==node)throw new Error('Hydration replaced the server node');}else await app.mount(container,{url:'http://localhost/',memoryRoute:{entryPath:'/'},props:{}});app.destroy();window.__retained.handles.push(app);}container.remove();}return window.__retained.handles.length;};
window.retainedCounts=()=>({contexts:refs.contexts.filter(x=>x.deref()).length,payloads:refs.payloads.filter(x=>x.deref()).length,snapshots:refs.snapshots.filter(x=>x.deref()).length,handles:window.__retained.handles.length});
`;
await esbuild.build({
  stdin: {
    contents: source,
    resolveDir: path.join(repo, 'packages/runtime/plugin-runtime'),
    loader: 'tsx',
  },
  bundle: true,
  jsx: 'automatic',
  platform: 'browser',
  format: 'iife',
  outfile: path.join(out, 'bundle.js'),
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.MODERN_ENABLE_HYDRATION': 'false',
    __webpack_chunk_load__: 'window.__perfChunkLoad',
    WEBPACK_CHUNK_LOAD: 'window.__perfChunkLoad',
  },
  minify: !process.env.RETENTION_HEAP,
});
const server = createServer((_req, res) =>
  res.end('<html><body></body></html>'),
);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = 'http://127.0.0.1:' + server.address().port;
const browser = await puppeteer.launch({
  headless: true,
  executablePath:
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
});
const results = { metadata: await fingerprint(repo), repo, variant };
try {
  for (const kind of ['ordinary', 'bridge', 'bridge-hydrate']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url);
    await page.evaluate(() => {
      window.__perfChunkLoad = () => Promise.resolve();
    });
    await page.addScriptTag({ path: path.join(out, 'bundle.js') });
    const cdp = await page.createCDPSession();
    async function collect() {
      for (let i = 0; i < 4; i++) {
        await cdp.send('HeapProfiler.collectGarbage');
        await page.evaluate(
          () => new Promise(resolve => setTimeout(resolve, 0)),
        );
      }
      return {
        ...(await page.metrics()),
        ...(await page.evaluate(() => window.retainedCounts())),
        ...(await cdp.send('Memory.getDOMCounters')),
      };
    }
    const before = await collect();
    await page.evaluate(kind => window.runRetained(kind, 50), kind);
    const retained = await collect();
    if (
      retained.handles !== 50 ||
      retained.contexts ||
      retained.payloads ||
      retained.snapshots
    )
      throw Error(
        `Disposed ${kind} handles retained instance data: ${JSON.stringify(retained)}`,
      );
    if (process.env.RETENTION_HEAP && kind === 'bridge') {
      const chunks = [];
      cdp.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }) =>
        chunks.push(chunk),
      );
      await cdp.send('HeapProfiler.takeHeapSnapshot', {
        reportProgress: false,
      });
      await writeFile(path.join(out, 'bridge.heapsnapshot'), chunks.join(''));
    }
    await page.evaluate(() => {
      window.__retained.handles = [];
    });
    const released = await collect();
    results[kind] = { before, retained, released, errors };
    if (errors.length) throw Error(errors.join('\n'));
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  await writeFile(
    path.join(out, 'results.json'),
    JSON.stringify(results, null, 2),
  );
}
console.log(JSON.stringify(results, null, 2));
