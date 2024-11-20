import * as path from 'path';
import type { Entrypoint, ServerRoute } from '@modern-js/types';
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
import type { AppToolsPlugin } from '../../new';
import type { AppNormalizedConfig, webpack } from '../../types';
import { emitResolvedConfig } from '../../utils/config';
import { getSelectedEntries } from '../../utils/getSelectedEntries';
import { printInstructions } from '../../utils/printInstructions';
import { generateRoutes } from '../../utils/routes';
import { checkIsBuildCommands } from './utils';

const debug = createDebugger('plugin-analyze');

export default ({
  bundler,
}: {
  bundler: 'webpack' | 'rspack';
}): AppToolsPlugin => ({
  name: '@modern-js/plugin-analyze',
  post: ['@modern-js/runtime'],
  setup: api => {
    let pagesDir: string[] = [];
    let nestedRouteEntries: string[] = [];

    api.onPrepare(async () => {
      const appContext = api.getAppContext();
      const resolvedConfig = api.getNormalizedConfig();
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

      if (apiOnly) {
        const { routes } = (await hooks.modifyServerRoutes.call({
          routes: [],
        })) as any as { routes: ServerRoute[] };

        debug(`server routes: %o`, routes);

        api.updateAppContext({ apiOnly, serverRoutes: routes });
        return;
      }

      const [{ getBundleEntry }, { getServerRoutes }, { getHtmlTemplate }] =
        await Promise.all([
          import('./getBundleEntry.js'),
          import('./getServerRoutes.js'),
          import('./getHtmlTemplate.js'),
        ]);

      // get runtime entry points
      const { entrypoints } = (await hooks.modifyEntrypoints.call({
        entrypoints: await getBundleEntry(
          api,
          appContext,
          resolvedConfig as any,
        ),
      })) as any as { entrypoints: Entrypoint[] };

      console.log('===entrypoints', entrypoints);

      debug(`entrypoints: %o`, entrypoints);

      const initialRoutes = getServerRoutes(entrypoints, {
        appContext,
        config: resolvedConfig as any,
      });

      const { routes } = (await hooks.modifyServerRoutes.call({
        routes: initialRoutes,
      })) as any;

      debug(`server routes: %o`, routes);

      api.updateAppContext({
        entrypoints,
        serverRoutes: routes,
      });

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
        config: resolvedConfig as any,
      });

      debug(`html templates: %o`, htmlTemplates);

      let checkedEntries = entrypoints.map(point => point.entryName);
      if (isDevCommand()) {
        const { entry } = minimist(getArgv());
        checkedEntries = await getSelectedEntries(
          typeof entry === 'string' ? entry.split(',') : entry,
          entrypoints,
        );
      }

      api.updateAppContext({
        entrypoints,
        checkedEntries,
        apiOnly,
        serverRoutes: routes,
        htmlTemplates,
      });

      if (checkIsBuildCommands()) {
        await hooks.generateEntryCode.call({ entrypoints });

        const normalizedConfig = api.getNormalizedConfig();
        const createBuilderForModern = await createBuilderGenerator(bundler);
        const builder = await createBuilderForModern({
          normalizedConfig: normalizedConfig as any,
          appContext: appContext as any,
        });

        builder.onBeforeBuild(async ({ bundlerConfigs, isFirstCompile }) => {
          if (!isFirstCompile) {
            return;
          }
          const hooks = api.getHooks();
          await generateRoutes(appContext as any);
          await hooks.onBeforeBuild.call({
            bundlerConfigs:
              bundlerConfigs as unknown as webpack.Configuration[],
          });
        });

        builder.onAfterBuild(async ({ stats }) => {
          const hooks = api.getHooks();
          hooks.onAfterBuild.call({ stats });
          await emitResolvedConfig(
            appContext.appDirectory,
            normalizedConfig as any,
          );
        });

        builder.onDevCompileDone(async ({ isFirstCompile }) => {
          const hooks = api.getHooks();
          hooks.onAfterDev.call({ isFirstCompile });

          if (isFirstCompile) {
            printInstructions(api, appContext, normalizedConfig);
          }
        });

        builder.onBeforeCreateCompiler(
          async ({ bundlerConfigs, environments }) => {
            const hooks = api.getHooks();

            // run modernjs framework `beforeCreateCompiler` hook
            await hooks.onBeforeCreateCompiler.call({
              bundlerConfigs: bundlerConfigs,
              environments,
            });
          },
        );

        builder.onAfterCreateCompiler(async ({ compiler, environments }) => {
          const hooks = api.getHooks();
          // run modernjs framework afterCreateCompiler hooks
          await hooks.onAfterCreateCompiler.call({
            compiler,
            environments,
          });
        });

        builder.addPlugins(resolvedConfig.builderPlugins);

        api.updateAppContext({ builder });
      }
    });

    api.onWatchFiles(async () => {
      return { files: pagesDir, isPrivate: true };
    });

    api.modifyResolvedConfig(resolved => {
      const appContext = api.getAppContext();
      const config = initialNormalizedConfig(
        resolved as AppNormalizedConfig<'shared'>,
        appContext,
        bundler,
      );
      return config;
    });
  },
});
