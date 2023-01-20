import * as path from 'path';
import {
  createDebugger,
  findExists,
  fs,
  getEntryOptions,
  isApiOnly,
  minimist,
  getCommand,
  isDevCommand,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { cloneDeep } from '@modern-js/utils/lodash';
import { createBuilderForModern } from '../builder';
import { printInstructions } from '../utils/printInstructions';
import { generateRoutes } from '../utils/routes';
import { emitResolvedConfig } from '../utils/config';
import { getSelectedEntries } from '../utils/getSelectedEntries';
import { AppTools } from '../types';
import { initialNormalizedConfig } from '../config';
import {
  getServerLoadersFile,
  isPageComponentFile,
  parseModule,
  replaceWithAlias,
} from './utils';
import {
  APP_CONFIG_NAME,
  APP_INIT_EXPORTED,
  APP_INIT_IMPORTED,
} from './constants';

const debug = createDebugger('plugin-analyze');

export default (): CliPlugin<AppTools> => ({
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
          fs.emptydirSync(appContext.internalDirectory);
        } catch {
          // FIXME:
        }

        const apiOnly = await isApiOnly(
          appContext.appDirectory,
          resolvedConfig.source?.entriesDir,
        );
        await hookRunners.addRuntimeExports();

        if (apiOnly) {
          const { routes } = await hookRunners.modifyServerRoutes({
            routes: [],
          });

          debug(`server routes: %o`, routes);

          appContext = {
            ...appContext,
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
          ...appContext,
          entrypoints,
          serverRoutes: routes,
        };
        api.setAppContext(appContext);

        nestedRouteEntries = entrypoints
          .map(point => point.nestedRoutesEntry)
          .filter(Boolean) as string[];

        pagesDir = entrypoints
          .map(point => point.entry)
          .filter(Boolean)
          .concat(nestedRouteEntries);

        originEntrypoints = cloneDeep(entrypoints);

        await generateCode(appContext, resolvedConfig, entrypoints, api);

        const htmlTemplates = await getHtmlTemplate(entrypoints, api, {
          appContext,
          config: resolvedConfig,
        });

        debug(`html templates: %o`, htmlTemplates);

        await hookRunners.addDefineTypes();

        debug(`add Define Types`);

        let checkedEntries = entrypoints.map(point => point.entryName);
        if (isDevCommand()) {
          const { entry } = minimist(process.argv.slice(2));
          checkedEntries = await getSelectedEntries(
            typeof entry === 'string' ? entry.split(',') : entry,
            entrypoints,
          );
        }

        appContext = {
          ...appContext,
          entrypoints,
          checkedEntries,
          apiOnly,
          serverRoutes: routes,
          htmlTemplates,
        };
        api.setAppContext(appContext);

        const command = getCommand();
        const buildCommands = ['dev', 'start', 'build', 'inspect', 'deploy'];
        if (buildCommands.includes(command)) {
          const normalizedConfig = api.useResolvedConfigContext();
          const builder = await createBuilderForModern({
            normalizedConfig: normalizedConfig as any,
            appContext,
            compatPluginConfig: {
              async onBeforeBuild({ bundlerConfigs }) {
                const hookRunners = api.useHookRunners();
                await generateRoutes(appContext);
                await hookRunners.beforeBuild({ bundlerConfigs });
              },

              async onAfterBuild({ stats }) {
                const hookRunners = api.useHookRunners();
                await hookRunners.afterBuild({ stats });
                await emitResolvedConfig(
                  appContext.appDirectory,
                  normalizedConfig,
                );
              },

              async onDevCompileDone({ isFirstCompile }) {
                const hookRunners = api.useHookRunners();
                if (process.stdout.isTTY || isFirstCompile) {
                  hookRunners.afterDev();

                  if (isFirstCompile) {
                    printInstructions(
                      hookRunners,
                      appContext,
                      normalizedConfig,
                    );
                  }
                }
              },

              async onBeforeCreateCompiler({ bundlerConfigs }) {
                const hookRunners = api.useHookRunners();
                // run modernjs framework `beforeCreateCompiler` hook
                await hookRunners.beforeCreateCompiler({
                  bundlerConfigs,
                });
              },

              async onAfterCreateCompiler({ compiler }) {
                const hookRunners = api.useHookRunners();
                // run modernjs framework afterCreateCompiler hooks
                await hookRunners.afterCreateCompiler({ compiler });
              },
            },
          });

          builder.addPlugins(resolvedConfig.builderPlugins);

          appContext = {
            ...appContext,
            builder,
          };
          api.setAppContext(appContext);
        }
      },
      watchFiles() {
        return pagesDir;
      },
      config() {
        return {
          tools: {
            webpackChain: (chain, { name }) => {
              const appContext = api.useAppContext();
              const resolvedConfig = api.useResolvedConfigContext();
              const { entrypoints, internalDirectory, packageName } =
                appContext;
              entrypoints.forEach(entrypoint => {
                const { entryName } = entrypoint;
                const ssr = getEntryOptions(
                  entryName,
                  resolvedConfig.server.ssr,
                  resolvedConfig.server.ssrByEntries,
                  packageName,
                );
                if (entrypoint.nestedRoutesEntry && ssr && name === 'server') {
                  const serverLoadersFile = getServerLoadersFile(
                    internalDirectory,
                    entryName,
                  );
                  chain
                    .entry(`${entryName}-server-loaders`)
                    .add(serverLoadersFile);
                }
              });
            },
          },
        };
      },

      resolvedConfig({ resolved }) {
        const appContext = api.useAppContext();
        const config = initialNormalizedConfig(resolved, appContext);
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
