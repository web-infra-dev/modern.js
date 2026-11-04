import { BridgeSSRPlugin, getBridgeSSRRuntimePlugin } from './BridgeSSRPlugin';
import type { Rspack } from '@rsbuild/core';
import { runtimeRegister } from '../../../../runtime/plugin-runtime/src/cli/template';
import * as browserPlugin from '../ssr-runtime/bridgeStreamPlugin';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

it.each(['legacy', 'conditional'])(
  'resolves the installed Bridge SSR context from a %s export map',
  format => {
    const app = fs.mkdtempSync(
      path.join(os.tmpdir(), 'modern-bridge-context-'),
    );
    const runtime = path.join(app, 'node_modules/@modern-js/runtime');
    const bridge = path.join(
      app,
      'node_modules/@module-federation/bridge-react',
    );
    try {
      fs.mkdirSync(runtime, { recursive: true });
      fs.mkdirSync(bridge, { recursive: true });
      fs.writeFileSync(
        path.join(runtime, 'package.json'),
        JSON.stringify({ name: '@modern-js/runtime' }),
      );
      fs.writeFileSync(
        path.join(bridge, 'package.json'),
        JSON.stringify({
          name: '@module-federation/bridge-react',
          exports: {
            './package.json': './package.json',
            './ssr': {
              import:
                format === 'legacy'
                  ? './ssr.mjs'
                  : { types: './ssr.d.mts', default: './ssr.mjs' },
            },
          },
        }),
      );
      const context = path.join(bridge, 'ssr.mjs');
      fs.writeFileSync(context, 'export {};');
      let resolve = (_data: { request: string; context: string }) => {};
      new BridgeSSRPlugin().apply({
        context: app,
        options: { target: 'node' },
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
      } as unknown as Rspack.Compiler);
      const request = {
        request: '@module-federation/bridge-react/ssr',
        context: app,
      };
      resolve(request);
      expect(request.request).toBe(fs.realpathSync(context));
    } finally {
      fs.rmSync(app, { recursive: true, force: true });
    }
  },
);

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
  '@module-federation/bridge-react/v19',
  '@module-federation/bridge-react/base',
  '@modern-js/runtime/router',
];

it('selects Modern Node implementations without replacing shared consumers or Routers', () => {
  expect(resolveRequests('async-node', requests)).toEqual([
    '@modern-js/runtime/mf/server',
    '@modern-js/runtime/mf/server',
    '@modern-js/runtime/internal/route-scope/server',
    '/runtime/ssr-runtime/bridgeStreamPlugin.node.mjs',
    '@module-federation/bridge-react/server',
    '@module-federation/bridge-react/server',
    ...requests.slice(6),
  ]);
});

it('unifies only the SSR context across package instances and module formats', () => {
  const contextRequests = [
    '@module-federation/bridge-react/ssr',
    './ssr.es.js',
    './ssr.cjs.js',
    './ssr.mjs',
    './ssr.cjs',
    '/other/bridge-react/dist/ssr.es.js',
    '/other/bridge-react/dist/ssr.mjs',
    '/other/bridge-react/dist/ssr.cjs',
  ];
  expect(resolveRequests('node', contextRequests)).toEqual(
    contextRequests.map(() => '/canonical/bridge-react/dist/ssr.es.js'),
  );
  expect(resolveRequests('web', contextRequests)).toEqual(contextRequests);
  const unrelated = ['./ssr.es.js', './ssr.mjs', './ssr.cjs'];
  expect(resolveRequests('node', unrelated, '/other/app')).toEqual(unrelated);
});

it.each(['web', 'webworker'])('leaves %s module resolution intact', target => {
  expect(resolveRequests(target, requests)).toEqual(requests);
});
