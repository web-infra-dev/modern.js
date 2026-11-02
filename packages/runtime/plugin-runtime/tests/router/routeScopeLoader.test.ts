import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseSync } from '@swc/core';
import { fs as modernFs } from '@modern-js/utils';
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
    expect(scopedRoutes).not.toContain('"path": "product"');
    expect(fullRoutes).toContain('"path": "product"');
    const definition = await fs.readFile(registryPath(selected), 'utf8');
    expect(definition).toContain('selected: true, dataRoute: "/product"');
    expect(definition).not.toContain(' route:');
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

it.each(['registry.js', path.join('index', '__loaders__', 'map.json')])(
  'keeps published %s complete while another expose regenerates the same scope',
  async target => {
    const internalDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'modern-scope-atomic-'),
    );
    const directory = path.join(internalDirectory, 'index');
    await fs.mkdir(directory);
    const graphFile = path.join(directory, 'route-scope.json');
    const graph = {
      entryName: 'index',
      metaName: 'modern-js',
      basename: '/',
      routes: [
        {
          id: 'product',
          path: '/product',
          type: 'nested',
          origin: 'config',
          _component: '/app/product.tsx',
        },
      ],
    };
    const source = `import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { createBridgeComponent } from '@modern-js/runtime/mf';
const App = createRoot({ route: '/product' });
export default createBridgeComponent({ rootComponent: App });`;
    const context = {
      getOptions: () => ({
        internalDirectory,
        metaName: 'modern-js',
        entrypoints: [{ entryName: 'index', isMainEntry: true }],
      }),
      resourcePath: '/app/Product.tsx',
      addDependency: () => {},
    } as unknown as ThisParameterType<typeof loader>;
    try {
      await fs.writeFile(graphFile, JSON.stringify(graph));
      await fs.writeFile(
        path.join(directory, 'runtime-register.js'),
        `import { registerPlugin } from '@modern-js/runtime/plugin'; const plugins = []; registerPlugin(plugins, {});`,
      );
      const code = await loader.call(context, source);
      const registry = (
        parseSync(code).body[0] as import('@swc/core').ImportDeclaration
      ).source.value;
      const filename = path.join(path.dirname(registry), target);
      const published = await fs.readFile(filename, 'utf8');
      await fs.writeFile(
        graphFile,
        JSON.stringify({
          ...graph,
          basename: '/producer',
          routes: graph.routes.map(route => ({
            ...route,
            loader: '/app/product.loader.ts',
          })),
        }),
      );
      let release!: () => void;
      let writing!: () => void;
      const pendingWrite = new Promise<void>(resolve => {
        release = resolve;
      });
      const started = new Promise<void>(resolve => {
        writing = resolve;
      });
      const outputFile = modernFs.outputFile.bind(modernFs);
      const spy = rstest
        .spyOn(modernFs, 'outputFile')
        .mockImplementation((async (filename: string, content: string) => {
          if (
            String(filename).startsWith(
              path.join(path.dirname(registry), target),
            )
          ) {
            await outputFile(filename, '');
            writing();
            await pendingWrite;
          }
          return outputFile(filename, content);
        }) as typeof modernFs.outputFile);
      const update = loader.call(
        {
          ...context,
          resourcePath: '/app/RetryProduct.tsx',
        } as ThisParameterType<typeof loader>,
        source,
      );
      try {
        await started;
        expect(await fs.readFile(filename, 'utf8')).toBe(published);
      } finally {
        release();
        await update;
        spy.mockRestore();
      }
      expect(await fs.readFile(registry, 'utf8')).toContain(
        'basename: "/producer"',
      );
      expect((await fs.readdir(path.dirname(registry))).sort()).toEqual([
        'index',
        'registry.js',
        'routes.js',
        'runtime.js',
      ]);
    } finally {
      await fs.rm(internalDirectory, { recursive: true, force: true });
    }
  },
);
