import * as path from 'path';
import {
  createDebugger,
  findExists,
  fs,
  isApiOnly,
  minimist,
  isDevCommand,
  getArgv,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { cloneDeep } from '@modern-js/utils/lodash';
import { printInstructions } from '../utils/printInstructions';
import { generateRoutes } from '../utils/routes';
import { emitResolvedConfig } from '../utils/config';
import { getSelectedEntries } from '../utils/getSelectedEntries';
import { AppTools, webpack } from '../types';
import { initialNormalizedConfig } from '../config';
import { createBuilderGenerator } from '../builder';
import {
  checkIsBuildCommands,
  isPageComponentFile,
  parseModule,
  replaceWithAlias,
} from './utils';
import {
  APP_CONFIG_NAME,
  APP_INIT_EXPORTED,
  APP_INIT_IMPORTED,
} from './constants';
import { generateIndexCode } from './generateCode';

const debug = createDebugger('plugin-analyze');

export default ({
  bundler,
}: {
  bundler: 'webpack' | 'rspack';
}): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-analyze',

  setup: api => {
    let pagesDir: string[] = [];
    let nestedRouteEntries: string[] = [];
    let originEntrypoints: any[] = [];

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

        const [
          { getBundleEntry },
          { getServerRoutes },
          { generateCode },
          { getHtmlTemplate },
        ] = await Promise.all([
          import('./getBundleEntry'),
          import('./getServerRoutes'),
          import('./generateCode'),
          import('./getHtmlTemplate'),
        ]);

        const entrypoints = getBundleEntry(appContext, resolvedConfig);

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

        originEntrypoints = cloneDeep(entrypoints);

        const { importsStatemets } = await generateCode(
          appContext,
          resolvedConfig,
          entrypoints,
          api,
        );

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
            if (process.stdout.isTTY || isFirstCompile) {
              hookRunners.afterDev({ isFirstCompile });

              if (isFirstCompile) {
                printInstructions(hookRunners, appContext, normalizedConfig);
              }
            }
          });

          builder.onBeforeCreateCompiler(async ({ bundlerConfigs }) => {
            const hookRunners = api.useHookRunners();
            await generateIndexCode({
              appContext,
              config: resolvedConfig,
              entrypoints,
              api,
              importsStatemets,
              bundlerConfigs,
            });

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

      // This logic is not in the router plugin to avoid having to include some dependencies in the utils package
      async modifyEntryImports({ entrypoint, imports }) {
        const appContext = api.useAppContext();
        const { srcDirectory, internalSrcAlias } = appContext;
        const { fileSystemRoutes, nestedRoutesEntry } = entrypoint;
        if (fileSystemRoutes && nestedRoutesEntry) {
          const rootLayoutPath = path.join(nestedRoutesEntry, 'layout');
          const rootLayoutFile = findExists(
            ['.js', '.ts', '.jsx', '.tsx'].map(
              ext => `${rootLayoutPath}${ext}`,
            ),
          );
          if (rootLayoutFile) {
            const rootLayoutBuffer = await fs.readFile(rootLayoutFile);
            const rootLayout = rootLayoutBuffer.toString();
            const [, moduleExports] = await parseModule({
              source: rootLayout.toString(),
              filename: rootLayoutFile,
            });
            const hasAppConfig = moduleExports.some(
              e => e.n === APP_CONFIG_NAME,
            );
            const generateLayoutPath = replaceWithAlias(
              srcDirectory,
              rootLayoutFile,
              internalSrcAlias,
            );
            if (hasAppConfig) {
              imports.push({
                value: generateLayoutPath,
                specifiers: [{ imported: APP_CONFIG_NAME }],
              });
            }

            const hasAppInit = moduleExports.some(
              e => e.n === APP_INIT_EXPORTED,
            );

            if (hasAppInit) {
              imports.push({
                value: generateLayoutPath,
                specifiers: [
                  { imported: APP_INIT_EXPORTED, local: APP_INIT_IMPORTED },
                ],
              });
            }
          }
        }
        return {
          entrypoint,
          imports,
        };
      },

      validateSchema() {
        return {
          target: 'output.splitRouteChunks',
          schema: {
            type: 'boolean',
          },
        };
      },

      async fileChange(e) {
        const appContext = api.useAppContext();
        const { appDirectory } = appContext;
        const { filename, eventType } = e;
        const isPageFile = (name: string) =>
          pagesDir.some(pageDir => name.includes(pageDir));

        const absoluteFilePath = path.resolve(appDirectory, filename);
        const isRouteComponent =
          isPageFile(absoluteFilePath) && isPageComponentFile(absoluteFilePath);

        if (
          isRouteComponent &&
          (eventType === 'add' || eventType === 'unlink')
        ) {
          const resolvedConfig = api.useResolvedConfigContext();
          const { generateCode } = await import('./generateCode');
          const entrypoints = cloneDeep(originEntrypoints);
          generateCode(appContext, resolvedConfig, entrypoints, api);
        }
      },
    };
  },
});
