import * as path from 'path';
import {
  createPlugin,
  registerHook,
  useAppContext,
  AppContext,
  useResolvedConfigContext,
  mountHook,
} from '@modern-js/core';
import { createAsyncWaterfall } from '@modern-js/plugin';
import { createDebugger, fs } from '@modern-js/utils';
import type {
  Entrypoint,
  ServerRoute,
  Route,
  HtmlPartials,
} from '@modern-js/types';
import clone from 'clone';
import type { ImportStatement } from './generateCode';
import type { RuntimePlugin } from './templates';
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

registerHook({
  modifyEntryImports,
  modifyEntryExport,
  modifyEntryRuntimePlugins,
  modifyEntryRenderFunction,
  modifyFileSystemRoutes,
  modifyServerRoutes,
  htmlPartials,
  addRuntimeExports,
  beforeGenerateRoutes,
});

export default createPlugin(
  () => {
    let pagesDir: string[] = [];
    let originEntrypoints: any[] = [];

    return {
      // eslint-disable-next-line max-statements
      async prepare() {
        /* eslint-disable react-hooks/rules-of-hooks */
        const appContext = useAppContext();
        const resolvedConfig = useResolvedConfigContext();
        /* eslint-enable react-hooks/rules-of-hooks */

        try {
          fs.emptydirSync(appContext.internalDirectory);
        } catch {
          // FIXME:
        }

        const existSrc = await fs.pathExists(appContext.srcDirectory);
        await (mountHook() as any).addRuntimeExports();

        if (!existSrc) {
          const { routes } = await (mountHook() as any).modifyServerRoutes({
            routes: [],
          });

          debug(`server routes: %o`, routes);

          AppContext.set({
            ...appContext,
            existSrc,
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

        debug(`entrypoints: %o`, entrypoints);

        const initialRoutes = getServerRoutes(entrypoints, {
          appContext,
          config: resolvedConfig,
        });

        const { routes } = await (mountHook() as any).modifyServerRoutes({
          routes: initialRoutes,
        });

        debug(`server routes: %o`, routes);

        AppContext.set({
          ...appContext,
          entrypoints,
          serverRoutes: routes,
        });

        pagesDir = entrypoints.map(point => point.entry);
        originEntrypoints = clone(entrypoints);

        await generateCode(appContext, resolvedConfig, entrypoints);

        const htmlTemplates = await getHtmlTemplate(entrypoints, {
          appContext,
          config: resolvedConfig,
        });

        debug(`html templates: %o`, htmlTemplates);

        AppContext.set({
          ...appContext,
          entrypoints,
          existSrc,
          serverRoutes: routes,
          htmlTemplates,
        });
      },

      watchFiles() {
        return pagesDir;
      },

      async fileChange(e) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();
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
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const resolvedConfig = useResolvedConfigContext();
          const { generateCode } = await import('./generateCode');
          const entrypoints = clone(originEntrypoints);
          generateCode(appContext, resolvedConfig, entrypoints);
        }
      },
    };
  },
  { name: '@modern-js/plugin-analyze' },
);
