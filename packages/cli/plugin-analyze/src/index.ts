import * as path from 'path';
import { createAsyncWaterfall } from '@modern-js/plugin';
import { createDebugger, fs, isApiOnly } from '@modern-js/utils';
import type {
  CliPlugin,
  RuntimePlugin,
  ImportStatement,
} from '@modern-js/core';
import type {
  Route,
  Entrypoint,
  ServerRoute,
  HtmlPartials,
} from '@modern-js/types';
import { cloneDeep } from '@modern-js/utils/lodash';
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

export const modifyFileSystemRoutes = createAsyncWaterfall<{
  entrypoint: Entrypoint;
  routes: Route[];
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

export default (): CliPlugin => ({
  name: '@modern-js/plugin-analyze',

  registerHook: {
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
        const appContext = api.useAppContext();
        const resolvedConfig = api.useResolvedConfigContext();
        const hookRunners = api.useHookRunners();

        try {
          fs.emptydirSync(appContext.internalDirectory);
        } catch {
          // FIXME:
        }

        const apiOnly = await isApiOnly(appContext.appDirectory);
        await hookRunners.addRuntimeExports();

        if (apiOnly) {
          const { routes } = await hookRunners.modifyServerRoutes({
            routes: [],
          });

          debug(`server routes: %o`, routes);

          api.setAppContext({
            ...appContext,
            apiOnly,
            serverRoutes: routes,
          });
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

        api.setAppContext({
          ...appContext,
          entrypoints,
          serverRoutes: routes,
        });

        pagesDir = entrypoints.map(point => point.entry);
        originEntrypoints = cloneDeep(entrypoints);

        await generateCode(appContext, resolvedConfig, entrypoints, api);

        const htmlTemplates = await getHtmlTemplate(entrypoints, api, {
          appContext,
          config: resolvedConfig,
        });

        debug(`html templates: %o`, htmlTemplates);

        await hookRunners.addDefineTypes();

        debug(`add Define Types`);

        api.setAppContext({
          ...appContext,
          entrypoints,
          checkedEntries: defaultChecked,
          apiOnly,
          serverRoutes: routes,
          htmlTemplates,
        });
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
