import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

it('renders a registry scope through built Node callbacks and the existing router context', async () => {
  const packageRoot = path.resolve(
    __dirname,
    '../../../../packages/runtime/plugin-runtime',
  );
  const { rspack } = createRequire(path.join(packageRoot, 'package.json'))(
    '@rsbuild/core',
  );
  const manifest = JSON.parse(
    await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'),
  );
  const importTarget = (entry: { import?: string; default: string }) =>
    entry.import || entry.default;
  const scope = importTarget(manifest.exports['./internal/route-scope/server']);
  const mf = importTarget(manifest.exports['./mf/server']);
  const plugin = manifest.exports['./plugin'].default;
  const router = manifest.exports['./router'].default;
  // The router build alias already selects the Node implementation in this
  // directory. New Node-only entries must retain its React Context identities.
  const nodeRouter = './dist/esm/router/runtime/plugin.node.mjs';
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'modern-bridge-exports-'),
  );
  const input = path.join(temporary, 'registry.js');
  const output = path.join(temporary, 'compiled.cjs');
  const from = (target: string) =>
    JSON.stringify(path.join(packageRoot, target));
  try {
    await fs.writeFile(
      input,
      `
import React from 'react';
import { createRuntime } from ${from(plugin)};
import { createScopedRoot } from ${from(scope)};
import { createBridgeComponent, render, hydrate, renderStream } from ${from(mf)};
import { routerPlugin } from ${from(nodeRouter)};
import { useLoaderData } from ${from(router)};
const Root = createScopedRoot({
  entryName: 'catalog', selected: true, basename: '/', serverLoaders: true,
  getDataBase: () => { throw new Error('SSR must run the local loader'); },
  routes: [{ id: 'detail', type: 'nested', isRoot: true, path: 'detail/:id',
    component: function Page({ label }) {
      const data = useLoaderData();
      return React.createElement('p', null, label + ':' + data.id);
    },
    loader: ({ params }) => ({ id: params.id }),
  }],
  createRuntime: (routesConfig, selected) => createRuntime([routerPlugin({}, routesConfig, selected)]),
});
export async function run() {
  const provider = createBridgeComponent({ rootComponent: Root, render, hydrate, renderStream })();
  const result = await provider.renderStream({
    instanceId: 'built-inventory',
    url: 'http://host/inventory/detail/42', basename: '/inventory',
    identifierPrefix: 'built-', props: { label: 'Built' },
    signal: new AbortController().signal,
  });
  let html = '';
  let snapshot;
  if ('protocol' in result) {
    const reader = result.messages.getReader();
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (value.type === 'html') html += value.html;
      if (value.type === 'data' || value.type === 'ready') snapshot = value.snapshot;
    }
  } else {
    html = await new Response(result.stream).text();
    snapshot = await result.snapshot;
  }
  return { html, snapshot };
}
`,
    );
    const compiler = rspack({
      mode: 'development',
      target: 'node',
      context: packageRoot,
      entry: input,
      devtool: false,
      resolve: {
        // Match Modern's Node extension selection, including its existing
        // async storage and server loader implementation.
        extensionAlias: { '.mjs': ['.node.mjs', '.server.mjs', '.mjs'] },
        modules: [path.join(packageRoot, 'node_modules'), 'node_modules'],
      },
      output: {
        path: temporary,
        filename: 'compiled.cjs',
        library: { type: 'commonjs2' },
      },
      optimization: { minimize: false },
    });
    await new Promise<void>((resolve, reject) => {
      compiler.run((error, stats) => {
        compiler.close(closeError => {
          if (error || closeError) reject(error || closeError);
          else if (stats?.hasErrors())
            reject(new Error(stats.toString({ all: false, errors: true })));
          else resolve();
        });
      });
    });
    const require = createRequire(input);
    const result = await require(output).run();
    expect(result.html).toContain('<p>Built:42</p>');
    expect(result.snapshot).toMatchObject({
      basename: '/inventory',
      routerData: { loaderData: { detail: { id: '42' } } },
    });
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
