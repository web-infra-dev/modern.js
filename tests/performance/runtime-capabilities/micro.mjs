import { fingerprint } from './fingerprint.mjs';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
const [repo, output] = process.argv.slice(2);
const metadata = await fingerprint(repo);
const require = createRequire(
  path.join(repo, 'packages/runtime/plugin-runtime/package.json'),
);
const { createRuntime } = require('./dist/cjs/core/plugin/index.js');
const {
  createApplicationInstance,
} = require('./dist/cjs/core/application/instance.js');
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
    createRuntime(plugins, undefined, context, capabilities),
};
const ordinaryInstance = () =>
  createApplicationInstance(definition, {
    isBrowser: true,
    output: 'document',
    basename: '/',
    initialUrl: '/',
  });
const bridgeInstance = () =>
  createScopeRuntime(definition, {
    isBrowser: true,
    basename: '/',
    initialUrl: '/',
  });
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
    ordinaryInstance,
    bridgeInstance,
    ordinaryRequest,
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
      rounds,
    },
    null,
    2,
  ),
);
console.log(output);
