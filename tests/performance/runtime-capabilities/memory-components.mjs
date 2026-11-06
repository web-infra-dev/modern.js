import { fingerprint } from './fingerprint.mjs';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
const [repo, out] = process.argv.slice(2);
if (!global.gc) throw Error('Run with --expose-gc');
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
const cancellation = (() => {
  const file = path.join(
    repo,
    'packages/runtime/plugin-runtime/dist/cjs/core/application/cancellation.js',
  );
  return existsSync(file) ? require(file).cancellationPlugin : undefined;
})();
const types = {
  engine: async () => {
    const context = getInitialContext(true, { routeAssets: {} });
    const runtime = createRuntime(plugins, undefined, context);
    if (legacy) runtime.pluginAPI.updateRuntimeContext(context);
    await runtime.ready;
    await runtime.hooks.onBeforeRender.call(context);
    const Root = runtime.hooks.wrapRoot.call(App);
    return { context, runtime, Root, dispose: () => runtime.dispose?.() };
  },
};
const legacy = !existsSync(
  path.join(
    repo,
    'packages/runtime/plugin-runtime/dist/cjs/core/application/instance.js',
  ),
);
const createApplicationInstance = legacy
  ? undefined
  : require('./dist/cjs/core/application/instance.js')
      .createApplicationInstance;
const definition = {
  App,
  routes: [],
  basename: '/',
  serverLoaders: false,
  selected: false,
  getDataBase: () => 'http://localhost:3000',
  createRuntime: (context, capabilities) =>
    legacy
      ? createRuntime(plugins)
      : createRuntime(plugins, undefined, context, capabilities),
};
const {
  createScopeRuntime,
} = require('./dist/cjs/core/react/scopeDefinition.js');
types.bridge = async () => {
  const scope = createScopeRuntime(definition, {
    isBrowser: true,
    initialUrl: 'http://localhost:3000/',
  });
  if (scope.prepare) await scope.prepare();
  else await scope.runtime.hooks.onBeforeRender.call(scope.context);
  return scope;
};
types.bridgeServer = async () => {
  const scope = createScopeRuntime(definition, {
    isBrowser: false,
    initialUrl: 'http://localhost:3000/',
    observeRouteCommits: true,
    plugins: cancellation ? [cancellation()] : undefined,
  });
  if (scope.prepare) await scope.prepare();
  else await scope.runtime.hooks.onBeforeRender.call(scope.context);
  return scope;
};
if (!legacy)
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
  const runtimeContexts = owners.map(
    x => new WeakRef(x.runtime.runtimeContext),
  );
  for (const x of owners) x.dispose?.();
  return { before, retained, refs, contexts, runtimeContexts };
}
const results = {
  metadata: await fingerprint(repo),
  node: process.version,
  contextContract: legacy
    ? 'legacy external Provider context plus deep-merged plugin context'
    : 'one canonical context',
  omittedGroups: legacy
    ? [
        'owner: ordinary registration reused a singleton, not an isolated application owner',
      ]
    : [],
  rounds: [],
};
for (const make of Object.values(types))
  for (let i = 0; i < 500; i++) (await make()).dispose?.();
for (let round = 0; round < 3; round++) {
  const row = {};
  for (const [name, make] of Object.entries(types)) {
    const { before, retained, refs, contexts, runtimeContexts } = await measure(
      make,
      1000,
    );
    for (let i = 0; i < 4; i++) {
      await new Promise(setImmediate);
      global.gc();
    }
    const reachable = refs.filter(x => x.deref()).length;
    const reachableContexts = contexts.filter(x => x.deref()).length;
    const reachableRuntimeContexts = runtimeContexts.filter(x =>
      x.deref(),
    ).length;
    if (reachable || reachableContexts || reachableRuntimeContexts)
      throw Error(`${name} retained disposed owners or contexts`);
    row[name] = {
      count: 1000,
      retainedBytes: retained - before,
      releasedHeapDelta: process.memoryUsage().heapUsed - before,
      reachable,
      reachableContexts,
      reachableRuntimeContexts,
    };
  }
  results.rounds.push(row);
}
await writeFile(out, JSON.stringify(results, null, 2));
