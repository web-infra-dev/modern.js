import { fingerprint } from './fingerprint.mjs';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
const [repo, out, variant] = process.argv.slice(2);
const require = createRequire(
  path.join(repo, 'packages/runtime/plugin-runtime/package.json'),
);
const { createRuntime } = require('./dist/cjs/core/plugin/index.js');
const { getInitialContext } = require('./dist/cjs/core/context/runtime.js');
const App = () => null;
const plugins = Array.from({ length: 8 }, (_, i) => ({
  name: 'measure-' + i,
  setup(api) {
    api.wrapRoot(Root => Root);
    api.onBeforeRender(context => {
      context['plugin' + i] = i;
    });
  },
}));
const types = {
  engine: async () => {
    const context = getInitialContext(true, { routeAssets: {} });
    const runtime =
      variant === 'baseline'
        ? createRuntime(plugins)
        : createRuntime(plugins, undefined, context);
    if (variant === 'baseline') runtime.pluginAPI.updateRuntimeContext(context);
    await runtime.ready;
    await runtime.hooks.onBeforeRender.call(context);
    const Root = runtime.hooks.wrapRoot.call(App);
    return { context, runtime, Root, dispose: () => runtime.dispose?.() };
  },
};
if (variant === 'head') {
  const {
    createApplicationInstance,
  } = require('./dist/cjs/core/application/instance.js');
  const definition = {
    App,
    routes: [],
    basename: '/',
    serverLoaders: false,
    selected: false,
    getDataBase: () => 'http://localhost:3000',
    createRuntime: (context, capabilities) =>
      createRuntime(plugins, undefined, context, capabilities),
  };
  const {
    createScopeRuntime,
  } = require('./dist/cjs/core/react/scopeDefinition.js');
  types.bridge = async () => {
    const scope = createScopeRuntime(definition, {
      isBrowser: true,
      initialUrl: 'http://localhost:3000/',
    });
    await scope.prepare();
    return scope;
  };
  types.bridgeServer = async () => {
    const scope = createScopeRuntime(definition, {
      isBrowser: false,
      initialUrl: 'http://localhost:3000/',
      observeRouteCommits: true,
    });
    await scope.prepare();
    return scope;
  };
  types.owner = async () => {
    const instance = createApplicationInstance(definition, {
      isBrowser: true,
      output: 'document',
      basename: '/',
      initialUrl: '/',
    });
    await instance.prepare();
    return instance;
  };
}
async function createBatch(make, count) {
  const owners = [];
  for (let i = 0; i < count; i++) owners.push(await make());
  global.gc();
  return owners;
}
async function measure(make, count) {
  global.gc();
  const before = process.memoryUsage().heapUsed;
  const owners = await createBatch(make, count);
  global.gc();
  const retained = process.memoryUsage().heapUsed;
  const refs = owners.map(x => new WeakRef(x));
  const contexts = owners.map(x => new WeakRef(x.context));
  for (const x of owners) x.dispose();
  return { before, retained, refs, contexts };
}
const results = {
  metadata: await fingerprint(repo),
  variant,
  node: process.version,
  rounds: [],
};
for (const make of Object.values(types))
  for (let i = 0; i < 500; i++) (await make()).dispose();
for (let round = 0; round < 3; round++) {
  const row = {};
  for (const [name, make] of Object.entries(types)) {
    const { before, retained, refs, contexts } = await measure(make, 1000);
    for (let i = 0; i < 4; i++) {
      await new Promise(setImmediate);
      global.gc();
    }
    row[name] = {
      count: 1000,
      retainedBytes: retained - before,
      releasedHeapDelta: process.memoryUsage().heapUsed - before,
      reachable: refs.filter(x => x.deref()).length,
      reachableContexts: contexts.filter(x => x.deref()).length,
    };
  }
  results.rounds.push(row);
}
await writeFile(out, JSON.stringify(results, null, 2));
