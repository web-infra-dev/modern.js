// import path from 'path';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import type { PluginOptions } from './types';
import { run } from './features';

export default (pluginOptions: PluginOptions): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-doc',
  setup: api => ({
    registerDev() {
      return {
        name: 'doc',
        menuItem: {
          name: 'doc',
          value: 'doc',
        },
        subCommands: ['doc'],
        async action(_, context) {
          const appContext = api.useAppContext();
          const { appDirectory } = appContext;

          await run({
            ...pluginOptions,
            appDir: appDirectory,
            isTsProject: context.isTsProject ?? false,
            isProduction: false,
          });
        },
      };
    },
    // async afterBuild() {
    //   const appContext = api.useAppContext();
    //   const { appDirectory } = appContext;
    //   const { serve } = await import('@modern-js/doc-core');
    //   await serve(appDirectory, {
    //     doc: {
    //       outDir: path.join(appDirectory, 'doc_build'),
    //     },
    //   });
    // },
    registerBuildPlatform() {
      return {
        platform: 'doc',
        async build(_, context) {
          const appContext = api.useAppContext();
          const { appDirectory } = appContext;
          await run({
            ...pluginOptions,
            appDir: appDirectory,
            isTsProject: context.isTsProject ?? false,
            isProduction: true,
          });
        },
      };
    },
  }),
});

export { run };
export type { PluginOptions };
