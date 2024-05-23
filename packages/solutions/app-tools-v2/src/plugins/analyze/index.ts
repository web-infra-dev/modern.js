import { createDebugger, fs, isApiOnly } from '@modern-js/utils';
import { CliPlugin } from '@modern-js/core';
import { AppTools, webpack } from '../../types';
import { createBuilderGenerator } from '../../builder';
import { emitResolvedConfig } from '../../utils/config';
import { printInstructions } from '../../utils/instruction';
import { checkIsBuildCommands } from './utils';

const debug = createDebugger('plugin-analyze');

export default ({
  bundler,
}: {
  bundler: 'webpack' | 'rspack';
}): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-analyze',

  setup: api => {
    return {
      async prepare() {
        let appContext = api.useAppContext();
        const resolvedConfig = api.useResolvedConfigContext();
        const hookRunners = api.useHookRunners();

        try {
          if (checkIsBuildCommands()) {
            fs.emptydirSync(appContext.internalDirectory);
          }
        } catch {
          // FIXME:
        }

        const apiOnly = await isApiOnly(
          appContext.appDirectory,
          resolvedConfig.source?.entriesDir,
          appContext.apiDirectory,
        );

        if (apiOnly) {
          const { routes } = await hookRunners.modifyServerRoutes({
            routes: [],
          });

          debug(`server routes: %o`, routes);

          appContext = {
            ...api.useAppContext(),
            apiOnly,
            serverRoutes: routes,
          };
          api.setAppContext(appContext);
          return;
        }
        if (checkIsBuildCommands()) {
          const normalizedConfig = api.useResolvedConfigContext();
          const createBuilderForModern = await createBuilderGenerator(bundler);
          const builder = await createBuilderForModern({
            normalizedConfig: normalizedConfig as any,
            appContext,
          });

          builder.onBeforeBuild(async ({ bundlerConfigs }) => {
            const hookRunners = api.useHookRunners();
            // await generateRoutes(appContext);
            await hookRunners.beforeBuild({
              bundlerConfigs:
                bundlerConfigs as unknown as webpack.Configuration[],
            });
          });

          builder.onAfterBuild(async ({ stats }) => {
            const hookRunners = api.useHookRunners();
            await hookRunners.afterBuild({ stats });
            await emitResolvedConfig(appContext.appDirectory, normalizedConfig);
          });

          builder.onDevCompileDone(async ({ isFirstCompile }) => {
            const hookRunners = api.useHookRunners();
            hookRunners.afterDev({ isFirstCompile });

            if (isFirstCompile) {
              printInstructions(hookRunners, appContext, normalizedConfig);
            }
          });

          builder.onBeforeCreateCompiler(async ({ bundlerConfigs }) => {
            const hookRunners = api.useHookRunners();

            // run modernjs framework `beforeCreateCompiler` hook
            await hookRunners.beforeCreateCompiler({
              bundlerConfigs:
                bundlerConfigs as unknown as webpack.Configuration[],
            });
          });

          builder.onAfterCreateCompiler(async ({ compiler }) => {
            const hookRunners = api.useHookRunners();
            // run modernjs framework afterCreateCompiler hooks
            await hookRunners.afterCreateCompiler({
              compiler: compiler as unknown as
                | webpack.Compiler
                | webpack.MultiCompiler,
            });
          });

          builder.addPlugins(resolvedConfig.builderPlugins);

          appContext = {
            ...api.useAppContext(),
            builder,
          };
          api.setAppContext(appContext);
        }
      },
    };
  },
});
