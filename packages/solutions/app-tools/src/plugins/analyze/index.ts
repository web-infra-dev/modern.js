import * as path from 'path';
import {
  createDebugger,
  fs,
  isApiOnly,
  minimist,
  isDevCommand,
  getArgv,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { printInstructions } from '../../utils/printInstructions';
import { generateRoutes } from '../../utils/routes';
import { emitResolvedConfig } from '../../utils/config';
import { getSelectedEntries } from '../../utils/getSelectedEntries';
import { AppTools, webpack } from '../../types';
import { initialNormalizedConfig } from '../../config';
import { createBuilderGenerator } from '../../builder';
import { checkIsBuildCommands } from './utils';

const debug = createDebugger('plugin-analyze');

export default ({
  bundler,
}: {
  bundler: 'webpack' | 'rspack';
}): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-analyze',
  post: ['@modern-js/runtime'],
  setup: api => {
    let pagesDir: string[] = [];
    let nestedRouteEntries: string[] = [];

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
        await hookRunners.addRuntimeExports();

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

        const [{ getBundleEntry }, { getServerRoutes }, { getHtmlTemplate }] =
          await Promise.all([
            import('./getBundleEntry'),
            import('./getServerRoutes'),
            import('./getHtmlTemplate'),
          ]);

        // get runtime entry points
        const { entrypoints } = await hookRunners.modifyEntrypoints({
          entrypoints: await getBundleEntry(
            hookRunners,
            appContext,
            resolvedConfig,
          ),
        });

        debug(`entrypoints: %o`, entrypoints);

        const initialRoutes = getServerRoutes(entrypoints, {
          appContext,
          config: resolvedConfig,
        });

        const { routes } = await hookRunners.modifyServerRoutes({
          routes: initialRoutes,
        });

        debug(`server routes: %o`, routes);

        appContext = {
          ...api.useAppContext(),
          entrypoints,
          serverRoutes: routes,
        };
        api.setAppContext(appContext);

        nestedRouteEntries = entrypoints
          .map(point => point.nestedRoutesEntry)
          .filter(Boolean) as string[];

        pagesDir = entrypoints
          .map(point => point.entry)
          // should only watch file-based routes
          .filter(entry => entry && !path.extname(entry))
          .concat(nestedRouteEntries);

        const htmlTemplates = await getHtmlTemplate(entrypoints, api, {
          appContext,
          config: resolvedConfig,
        });

        debug(`html templates: %o`, htmlTemplates);

        await hookRunners.addDefineTypes();

        debug(`add Define Types`);

        let checkedEntries = entrypoints.map(point => point.entryName);
        if (isDevCommand()) {
          const { entry } = minimist(getArgv());
          checkedEntries = await getSelectedEntries(
            typeof entry === 'string' ? entry.split(',') : entry,
            entrypoints,
          );
        }

        appContext = {
          ...api.useAppContext(),
          entrypoints,
          checkedEntries,
          apiOnly,
          serverRoutes: routes,
          htmlTemplates,
        };

        api.setAppContext(appContext);

        if (checkIsBuildCommands()) {
          const normalizedConfig = api.useResolvedConfigContext();
          const createBuilderForModern = await createBuilderGenerator(bundler);
          const builder = await createBuilderForModern({
            normalizedConfig: normalizedConfig as any,
            appContext,
          });

          builder.onBeforeBuild(async ({ bundlerConfigs }) => {
            const hookRunners = api.useHookRunners();
            await generateRoutes(appContext);
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

            await hookRunners.generateEntryCode({ entrypoints });
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

      watchFiles() {
        return { files: pagesDir, isPrivate: true };
      },

      resolvedConfig({ resolved }) {
        const appContext = api.useAppContext();
        const config = initialNormalizedConfig(resolved, appContext, bundler);
        return {
          resolved: config,
        };
      },
    };
  },
});
