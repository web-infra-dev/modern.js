import { BridgeSSRPlugin, getBridgeSSRRuntimePlugin } from './BridgeSSRPlugin';
import type { Rspack } from '@rsbuild/core';
import { runtimeRegister } from '../../../../runtime/plugin-runtime/src/cli/template';
import * as browserPlugin from '../ssr-runtime/bridgeStreamPlugin';

it.each(['cjs', 'esm-node'])(
  'generates the exported runtime name and the same ESM entry from the %s CLI',
  format => {
    const plugin = getBridgeSSRRuntimePlugin(`/package/dist/${format}/cli`);
    expect(plugin.path).toBe(
      '/package/dist/esm/ssr-runtime/bridgeStreamPlugin.mjs',
    );
    const generated = runtimeRegister({
      entryName: 'main',
      srcDirectory: '/app/src',
      internalSrcAlias: '@',
      metaName: 'modern-js',
      runtimeConfigFile: false,
      runtimePlugins: [plugin],
    });
    expect(generated).toContain(
      `import { bridgeStreamPlugin } from '${plugin.path}'`,
    );
    expect(browserPlugin).toHaveProperty(`${plugin.name}Plugin`);
  },
);

function resolveRequests(
  target: string,
  requests: string[],
  context = '/dependency/bridge-react/dist',
) {
  let resolve = (_data: { request: string; context: string }) => {};
  const compiler = {
    options: { target },
    hooks: {
      normalModuleFactory: {
        tap(_name: string, callback: (factory: unknown) => void) {
          callback({
            hooks: {
              beforeResolve: {
                tap(_name: string, fn: typeof resolve) {
                  resolve = fn;
                },
              },
            },
          });
        },
      },
    },
  } as unknown as Rspack.Compiler;
  new BridgeSSRPlugin('custom', '/canonical/bridge-react/dist/ssr.es.js').apply(
    compiler,
  );
  return requests.map(request => {
    const data = { request, context };
    resolve(data);
    return data.request;
  });
}
const requests = [
  '@modern-js/runtime/mf',
  '@custom/runtime/mf',
  '@modern-js/runtime/internal/route-scope',
  '/runtime/ssr-runtime/bridgeStreamPlugin.mjs',
  '@module-federation/bridge-react/v18',
  '@module-federation/bridge-react/base',
  '@modern-js/runtime/router',
];

it('selects Modern Node implementations without replacing shared consumers or Routers', () => {
  expect(resolveRequests('async-node', requests)).toEqual([
    '@modern-js/runtime/mf/server',
    '@modern-js/runtime/mf/server',
    '@modern-js/runtime/internal/route-scope/server',
    '/runtime/ssr-runtime/bridgeStreamPlugin.node.mjs',
    ...requests.slice(4),
  ]);
});

it('unifies only the SSR context across package instances and module formats', () => {
  const contextRequests = [
    '@module-federation/bridge-react/ssr',
    './ssr.es.js',
    './ssr.cjs.js',
    '/other/bridge-react/dist/ssr.es.js',
  ];
  expect(resolveRequests('node', contextRequests)).toEqual(
    contextRequests.map(() => '/canonical/bridge-react/dist/ssr.es.js'),
  );
  expect(resolveRequests('web', contextRequests)).toEqual(contextRequests);
  expect(resolveRequests('node', ['./ssr.es.js'], '/other/app')).toEqual([
    './ssr.es.js',
  ]);
});

it.each(['web', 'webworker'])('leaves %s module resolution intact', target => {
  expect(resolveRequests(target, requests)).toEqual(requests);
});
