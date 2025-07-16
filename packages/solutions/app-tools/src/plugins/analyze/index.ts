import * as path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  fs,
  createDebugger,
  getArgv,
  isApiOnly,
  isDevCommand,
  minimist,
} from '@modern-js/utils';
import { createBuilderGenerator } from '../../builder';
import { initialNormalizedConfig } from '../../config';
import type {
  AppNormalizedConfig,
  AppTools,
  CliPluginFuture,
} from '../../types';
import { emitResolvedConfig } from '../../utils/config';
import { getSelectedEntries } from '../../utils/getSelectedEntries';
import { printInstructions } from '../../utils/printInstructions';
import { generateRoutes } from '../../utils/routes';
import { checkIsBuildCommands, checkIsServeCommand } from './utils';

const debug = createDebugger('plugin-analyze');

export default (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-analyze',
  post: ['@modern-js/runtime'],
  setup: api => {
    let pagesDir: string[] = [];
    let nestedRouteEntries: string[] = [];

    api.onPrepare(async () => {
      let appContext = api.getAppContext();
      const resolvedConfig = api.getNormalizedConfig() as AppNormalizedConfig;
      const hooks = api.getHooks();

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
      await hooks.addRuntimeExports.call();

      const [{ getProdServerRoutes }] = await Promise.all([
        import('./getServerRoutes.js'),
      ]);

      if (apiOnly) {
        const routes: ServerRoute[] = [];
        if (checkIsServeCommand()) {
          routes.push(...getProdServerRoutes(appContext.distDirectory));
        } else {
          const { routes: modifiedRoutes } =
            await hooks.modifyServerRoutes.call({
              routes: [],
            });
          routes.push(...modifiedRoutes);
        }

        debug(`server routes: %o`, routes);

        api.updateAppContext({
          apiOnly,
          serverRoutes: routes,
        });
        return;
      }

      const [{ getBundleEntry }, { getServerRoutes }, { getHtmlTemplate }] =
        await Promise.all([
          import('./getBundleEntry.js'),
          import('./getServerRoutes.js'),
          import('./getHtmlTemplate.js'),
        ]);

      // get runtime entry points
      const { entrypoints } = await hooks.modifyEntrypoints.call({
        entrypoints: await getBundleEntry(hooks, appContext, resolvedConfig),
      });

      debug(`entrypoints: %o`, entrypoints);

      const routes: ServerRoute[] = [];
      if (checkIsServeCommand()) {
        routes.push(...getProdServerRoutes(appContext.distDirectory));
      } else {
        const initialRoutes = getServerRoutes(entrypoints, {
          appContext,
          config: resolvedConfig,
        });

        const { routes: modifiedRoutes } = await hooks.modifyServerRoutes.call({
          routes: initialRoutes,
        });
        routes.push(...modifiedRoutes);
      }

      debug(`server routes: %o`, routes);

      appContext = {
        ...api.getAppContext(),
        entrypoints,
        serverRoutes: routes,
      };
      api.updateAppContext(appContext);

      nestedRouteEntries = entrypoints
        .map((point: any) => point.nestedRoutesEntry)
        .filter(Boolean) as string[];

      pagesDir = entrypoints
        .map((point: any) => point.entry)
        // should only watch file-based routes
        .filter((entry: any) => entry && !path.extname(entry))
        .concat(nestedRouteEntries);

      const { partialsByEntrypoint, htmlTemplates } = await getHtmlTemplate(
        entrypoints,
        hooks,
        {
          appContext,
          config: resolvedConfig,
        },
      );

      debug(`html templates: %o`, htmlTemplates);

      api.updateAppContext({
        partialsByEntrypoint,
      });

      let checkedEntries = entrypoints.map(point => point.entryName);
      if (isDevCommand()) {
        const { entry } = minimist(getArgv());
        checkedEntries = await getSelectedEntries(
          typeof entry === 'string' ? entry.split(',') : entry,
          entrypoints,
        );
      }

      appContext = {
        ...api.getAppContext(),
        entrypoints,
        checkedEntries,
        apiOnly,
        serverRoutes: routes,
        htmlTemplates,
      };

      api.updateAppContext(appContext);

      if (checkIsBuildCommands()) {
        await hooks.generateEntryCode.call({ entrypoints });

        const normalizedConfig =
          api.getNormalizedConfig() as AppNormalizedConfig;
        const createBuilderForModern = await createBuilderGenerator();
        const builder = await createBuilderForModern({
          normalizedConfig: normalizedConfig as any,
          appContext: appContext as any,
        });

        builder.onBeforeBuild(
          async ({ bundlerConfigs, isFirstCompile, environments, isWatch }) => {
            if (!isFirstCompile) {
              return;
            }
            await generateRoutes(appContext);
            await hooks.onBeforeBuild.call({
              isFirstCompile,
              isWatch,
              environments,
              bundlerConfigs,
            });
          },
        );

        builder.onAfterBuild(
          async ({ stats, environments, isFirstCompile, isWatch }) => {
            await hooks.onAfterBuild.call({
              stats,
              environments,
              isFirstCompile,
              isWatch,
            });
            await emitResolvedConfig(appContext.appDirectory, normalizedConfig);
          },
        );

        builder.onDevCompileDone(
          async ({ isFirstCompile, stats, environments }) => {
            hooks.onDevCompileDone.call({
              isFirstCompile,
              stats,
              environments,
            });

            if (isFirstCompile) {
              printInstructions(hooks, appContext, normalizedConfig);
            }
          },
        );

        builder.onBeforeCreateCompiler(
          async ({ bundlerConfigs, environments }) => {
            // run modernjs framework `beforeCreateCompiler` hook
            await hooks.onBeforeCreateCompiler.call({
              environments,
              bundlerConfigs,
            });
          },
        );

        builder.onAfterCreateCompiler(async ({ compiler, environments }) => {
          // run modernjs framework afterCreateCompiler hooks
          await hooks.onAfterCreateCompiler.call({
            environments,
            compiler,
          });
        });

        builder.onAfterStartDevServer(async ({ port }) => {
          await hooks.onAfterDev.call({ port });
        });

        builder.addPlugins(resolvedConfig.builderPlugins);

        api.updateAppContext({ builder });
      }
    });

    api.addWatchFiles(() => {
      return { files: pagesDir, isPrivate: true };
    });

    api.modifyResolvedConfig((resolved: any) => {
      const appContext = api.getAppContext();
      const config = initialNormalizedConfig(
        resolved as AppNormalizedConfig,
        appContext,
      );
      return config;
    });
  },
});
