import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { transformSync } from '@swc/core';
import { runtimeFactory, runtimeRegister } from '../../src/cli/template';

function evaluateModule(source: string, modules: Record<string, unknown>) {
  const { code } = transformSync(source, { module: { type: 'commonjs' } });
  const exports: Record<string, any> = {};
  new Function('require', 'exports', code)((id: string) => {
    if (!(id in modules)) throw new Error(`Unexpected import: ${id}`);
    return modules[id];
  }, exports);
  return exports;
}

it('shares an inert runtime definition and creates plugins for each application context', async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'modern-runtime-factory-'),
  );
  try {
    await fs.writeFile(path.join(directory, 'runtime.ts'), 'export default {}');
    const configure = rstest.fn((entryName: string) => ({
      entryName,
      router: { basename: '/configured' },
    }));
    const routerPlugin = rstest.fn((config: unknown) => ({ config }));
    const createRuntime = rstest.fn((plugins, config, context) => ({
      plugins,
      config,
      context,
    }));
    const registerRuntimeDefinition = rstest.fn();
    const pluginModule = {
      createRuntime,
      registerRuntimeDefinition,
      mergeConfig: (...configs: object[]) => Object.assign({}, ...configs),
    };
    const factory = evaluateModule(
      runtimeFactory({
        entryName: 'shop',
        srcDirectory: directory,
        internalSrcAlias: '@source',
        metaName: 'modern-js',
        runtimeConfigFile: 'runtime',
        runtimePlugins: [
          {
            name: 'router',
            path: '@modern-js/runtime/router/internal',
            config: { supportHtml5History: false },
          },
        ],
      }),
      {
        '@modern-js/runtime/plugin': pluginModule,
        '@modern-js/runtime/router/internal': { routerPlugin },
        '@source/runtime': { __esModule: true, default: configure },
      },
    );

    // An exported application can import the factory without running setup or
    // replacing the page application's registered definition.
    expect(configure).not.toHaveBeenCalled();
    expect(routerPlugin).not.toHaveBeenCalled();
    expect(createRuntime).not.toHaveBeenCalled();
    expect(registerRuntimeDefinition).not.toHaveBeenCalled();

    evaluateModule(runtimeRegister({ metaName: 'modern-js' }), {
      '@modern-js/runtime/plugin': pluginModule,
      './runtime.js': factory,
    });
    expect(registerRuntimeDefinition).toHaveBeenCalledWith(
      factory.createRegistryRuntime,
    );
    expect(createRuntime).not.toHaveBeenCalled();

    const pageContext = { application: { selected: false } };
    const exportContext = { application: { selected: true } };
    const page = factory.createRegistryRuntime(pageContext);
    const exported = factory.createRegistryRuntime(exportContext);
    expect(page.context).toBe(pageContext);
    expect(exported.context).toBe(exportContext);
    expect(page.plugins).not.toBe(exported.plugins);
    expect(page.plugins[0]).not.toBe(exported.plugins[0]);
    expect(page.config).not.toBe(exported.config);
    expect(configure.mock.calls).toEqual([['shop'], ['shop']]);
    expect(routerPlugin.mock.calls).toEqual([
      [{ supportHtml5History: false, basename: '/configured' }],
      [{ supportHtml5History: false, basename: '/configured' }],
    ]);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
