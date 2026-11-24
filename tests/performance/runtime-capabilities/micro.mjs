import { fingerprint } from './fingerprint.mjs';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
const [repo, output] = process.argv.slice(2);
const metadata = await fingerprint(repo);
const require = createRequire(
  path.join(repo, 'packages/runtime/plugin-runtime/package.json'),
);
const { createRuntime } = require('./dist/cjs/core/plugin/index.js');
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
const { getInitialContext } = require('./dist/cjs/core/context/runtime.js');
const {
  createScopeRuntime,
} = require('./dist/cjs/core/react/scopeDefinition.js');
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
const engine = () => {
  const context = getInitialContext(true, { routeAssets: {} });
  const runtime = createRuntime(plugins, undefined, context);
  if (legacy) runtime.pluginAPI.updateRuntimeContext(context);
  return {
    async prepare() {
      await runtime.ready;
      await runtime.hooks.onBeforeRender.call(context);
      runtime.hooks.wrapRoot.call(App);
    },
    dispose: () => runtime.dispose?.(),
  };
};
const ordinaryInstance = () =>
  createApplicationInstance(definition, {
    isBrowser: true,
    output: 'document',
    basename: '/',
    initialUrl: '/',
  });
const bridgeInstance = () => {
  const instance = createScopeRuntime(definition, {
    isBrowser: true,
    basename: '/',
    initialUrl: '/',
  });
  return legacy
    ? {
        prepare: () =>
          instance.runtime.hooks.onBeforeRender.call(instance.context),
        dispose: () => instance.dispose?.(),
      }
    : instance;
};
const cancellation = (() => {
  try {
    return require('./dist/cjs/core/application/cancellation.js')
      .cancellationPlugin;
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
})();
const ordinaryRequest = () => {
  const signal = new AbortController().signal;
  return createApplicationInstance(definition, {
    isBrowser: false,
    output: 'document',
    initialUrl: 'http://localhost/',
    signal,
    plugins: cancellation ? [cancellation(signal)] : undefined,
  });
};
const rounds = [];
for (let round = 0; round < 9; round++) {
  const result = {};
  for (const [name, make] of Object.entries({
    engine,
    ...(!legacy && { ordinaryInstance }),
    bridgeInstance,
    ...(!legacy && { ordinaryRequest }),
  })) {
    for (let i = 0; i < 500; i++) {
      const x = make();
      await x.prepare();
      x.dispose();
    }
    global.gc();
    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      const x = make();
      await x.prepare();
      x.dispose();
    }
    result[name] = (performance.now() - start) / 5000;
  }
  rounds.push(result);
}
await writeFile(
  output,
  JSON.stringify(
    {
      metadata,
      node: process.version,
      plugins: 8,
      warmup: 500,
      iterations: 5000,
      contextContract: legacy
        ? 'legacy external Provider context plus deep-merged plugin context'
        : 'one canonical context',
      omittedGroups: legacy
        ? [
            'ordinaryInstance and ordinaryRequest: legacy global registration is not an isolated-owner contract',
          ]
        : [],
      rounds,
    },
    null,
    2,
  ),
);
console.log(output);
