import * as path from 'path';
import { createAsyncWaterfall } from '@modern-js/plugin';
import { createDebugger, fs, isApiOnly } from '@modern-js/utils';
import type {
  CliPlugin,
  RuntimePlugin,
  ImportStatement,
} from '@modern-js/core';
import type {
  RouteLegacy,
  Entrypoint,
  ServerRoute,
  HtmlPartials,
  NestedRoute,
  PageRoute,
} from '@modern-js/types';
import { cloneDeep } from '@modern-js/utils/lodash';
import { createBuilderForEdenX } from '../builder';
import { printInstructions } from '../utils/printInstructions';
import { generateRoutes } from '../utils/routes';
import { emitResolvedConfig } from '../utils/config';
import { getCommand } from '../utils/commands';
import type { AppHooks } from '../hooks';
import { isRouteComponentFile } from './utils';

const debug = createDebugger('plugin-analyze');

export const modifyEntryImports = createAsyncWaterfall<{
  imports: ImportStatement[];
  entrypoint: Entrypoint;
}>();
export const modifyEntryExport = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  exportStatement: string;
}>();
export const addRuntimeExports = createAsyncWaterfall();
export const modifyEntryRuntimePlugins = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  plugins: RuntimePlugin[];
}>();
export const modifyEntryRenderFunction = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  code: string;
}>();

export const modifyAsyncEntry = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  code: string;
}>();

export const modifyFileSystemRoutes = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  routes: RouteLegacy[] | (NestedRoute | PageRoute)[];
}>();

export const modifyServerRoutes = createAsyncWaterfall<{
  routes: ServerRoute[];
}>();

export const htmlPartials = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  partials: HtmlPartials;
}>();

export const beforeGenerateRoutes = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  code: string;
}>();
export const addDefineTypes = createAsyncWaterfall();

export default (): CliPlugin<AppHooks> => ({
  name: '@modern-js/plugin-analyze',

  registerHook: {
    modifyAsyncEntry,
    modifyEntryImports,
    modifyEntryExport,
    modifyEntryRuntimePlugins,
    modifyEntryRenderFunction,
    modifyFileSystemRoutes,
    modifyServerRoutes,
    htmlPartials,
    addRuntimeExports,
    beforeGenerateRoutes,
    addDefineTypes,
  },

  setup: api => {
    let pagesDir: string[] = [];
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
          resolvedConfig?.source?.entriesDir,
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
        const defaultChecked = entrypoints.map(point => point.entryName);

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

        const nestedRouteEntries = entrypoints
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

        appContext = {
          ...appContext,
          entrypoints,
          checkedEntries: defaultChecked,
          apiOnly,
          serverRoutes: routes,
          htmlTemplates,
        };
        api.setAppContext(appContext);

        const command = getCommand();
        const buildCommands = ['dev', 'build', 'inspect'];

        if (buildCommands.includes(command)) {
          const normalizedConfig = api.useResolvedConfigContext();

          const builder = await createBuilderForEdenX({
            normalizedConfig,
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

      async fileChange(e) {
        const appContext = api.useAppContext();
        const { appDirectory } = appContext;
        const { filename, eventType } = e;
        const isPageFile = (name: string) =>
          pagesDir.some(pageDir => name.includes(pageDir));

        const absoluteFilePath = path.resolve(appDirectory, filename);
        const isRouteComponent =
          isPageFile(absoluteFilePath) &&
          isRouteComponentFile(absoluteFilePath);

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
