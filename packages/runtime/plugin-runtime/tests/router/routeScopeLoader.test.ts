import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseSync } from '@swc/core';
import loader from '../../src/cli/federation/loader';

it('rewrites only the expose resource and emits independent complete and selected dependency graphs', async () => {
  const internalDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'modern-scope-loader-'),
  );
  const entryDirectory = path.join(internalDirectory, 'index');
  await fs.mkdir(entryDirectory);
  try {
    await fs.writeFile(
      path.join(entryDirectory, 'route-scope.json'),
      JSON.stringify({
        entryName: 'index',
        metaName: 'modern-js',
        basename: '/',
        ssrMode: false,
        routes: [
          {
            id: 'root',
            type: 'nested',
            origin: 'file-system',
            isRoot: true,
            path: '/',
            _component: '/app/root.tsx',
            children: [
              {
                id: 'product',
                type: 'nested',
                origin: 'file-system',
                path: 'product',
                _component: '/app/product.tsx',
              },
              {
                id: 'orders',
                type: 'nested',
                origin: 'file-system',
                path: 'orders',
                _component: '/app/orders.tsx',
              },
            ],
          },
        ],
      }),
    );
    await fs.writeFile(
      path.join(entryDirectory, 'runtime-register.js'),
      `
import { registerPlugin, mergeConfig } from '@modern-js/runtime/plugin';
import { getCurrentEntryName } from '@modern-js/runtime/context';
import { routerPlugin } from '@modern-js/runtime/router/internal';
const plugins = [];
const runtimeConfig = { entryName: getCurrentEntryName() };
plugins.push(routerPlugin(mergeConfig({})));
registerPlugin(plugins, runtimeConfig);
`,
    );
    const source = (argument: string) => `
import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { render, hydrateWithReact } from '@modern-js/runtime/browser';
import { createBridgeComponent } from '@modern-js/runtime/mf';
const App = createRoot(${argument});
export default createBridgeComponent({ rootComponent: App, render });
`;
    const dependencies: string[] = [];
    const context = {
      getOptions: () => ({
        internalDirectory,
        metaName: 'modern-js',
        entrypoints: [{ entryName: 'index', isMainEntry: true }],
      }),
      resourcePath: '/app/export.tsx',
      addDependency: (filename: string) => dependencies.push(filename),
    } as unknown as ThisParameterType<typeof loader>;
    const full = await loader.call(context, source(''));
    const selected = await loader.call(
      context,
      source("{ route: '/product' }"),
    );
    const registryPath = (code: string) =>
      (parseSync(code).body[0] as import('@swc/core').ImportDeclaration).source
        .value;
    expect(registryPath(full)).not.toBe(registryPath(selected));
    expect(selected).toMatch(
      /import \{ hydrateWithReact \} from ['"]@modern-js\/runtime\/browser['"]/,
    );
    const fullRoutes = await fs.readFile(
      path.join(path.dirname(registryPath(full)), 'routes.js'),
      'utf8',
    );
    const scopedRoutes = await fs.readFile(
      path.join(path.dirname(registryPath(selected)), 'routes.js'),
      'utf8',
    );
    expect(fullRoutes).toContain('/app/orders.tsx');
    expect(scopedRoutes).toContain('/app/product.tsx');
    expect(scopedRoutes).toContain('/app/root.tsx');
    expect(scopedRoutes).not.toContain('/app/orders.tsx');
    expect(scopedRoutes).toContain(
      'const routeModuleCache = Object.create(null)',
    );
    expect(scopedRoutes).not.toContain('window.');
    const runtime = await fs.readFile(
      path.join(path.dirname(registryPath(selected)), 'runtime.js'),
      'utf8',
    );
    expect(runtime).toContain('createRuntime as registerPlugin');
    expect(runtime).toContain('routesConfig');
    expect(runtime).not.toContain('getCurrentEntryName()');
    expect(dependencies).toContain(
      path.join(entryDirectory, 'route-scope.json'),
    );
    expect(await loader.call(context, 'export default () => null')).toBe(
      'export default () => null',
    );
  } finally {
    await fs.rm(internalDirectory, { recursive: true, force: true });
  }
});
