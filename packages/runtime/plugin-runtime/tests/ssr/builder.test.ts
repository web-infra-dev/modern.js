import type { AppTools } from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin';
import { ssrPlugin } from '../../src/cli/ssr';

function getEnvironmentPatch(
  target: string,
  name: string,
  userConfig: Record<string, unknown>,
) {
  let patch: any;
  const modernAPI = {
    getAppContext: () => ({
      metaName: 'modern-js',
      moduleType: 'commonjs',
      appDirectory: __dirname,
      entrypoints: [],
    }),
    getNormalizedConfig: () => userConfig,
    config(callback: () => any) {
      const config = callback();
      config.builderPlugins[0].setup({
        modifyEnvironmentConfig(modify: (...args: any[]) => any) {
          patch = modify(
            { output: { target } },
            {
              name,
              mergeEnvironmentConfig: (_config: any, next: any) => next,
            },
          );
        },
      });
    },
  } as unknown as CLIPluginAPI<AppTools>;
  ssrPlugin().setup!(modernAPI);
  return patch;
}

describe('SSR module error handling', () => {
  it.each(['string', 'stream'])(
    'retains module initialization errors in the %s SSR server bundle',
    mode => {
      const patch = getEnvironmentPatch('node', 'server', {
        server: { ssr: { mode } },
        output: {},
      });
      expect(patch.tools.rspack).toEqual({
        output: { strictModuleErrorHandling: true },
      });
    },
  );

  it('retains module errors in the worker SSR bundle', () => {
    const patch = getEnvironmentPatch('web-worker', 'workerSSR', {
      server: { ssr: true },
      deploy: { worker: { ssr: true } },
      output: {},
    });
    expect(patch.tools.rspack?.output.strictModuleErrorHandling).toBe(true);
  });

  it('does not change the browser bundle in an SSR app', () => {
    const patch = getEnvironmentPatch('web', 'web', {
      server: { ssr: true },
      output: {},
    });
    expect(patch.tools.rspack).toBeUndefined();
    expect(patch.tools.bundlerChain).toBeTypeOf('function');
  });

  it.each(['web', 'node'])(
    'does not change the %s bundle in a CSR app',
    target => {
      const patch = getEnvironmentPatch(target, target, {
        server: { ssr: false },
        output: {},
      });
      expect(patch.tools.rspack).toBeUndefined();
    },
  );
});
