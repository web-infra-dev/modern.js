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
import type { ImportStatement } from './generateCode';
import type { RuntimePlugin } from './templates';

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

registerHook({
  modifyEntryImports,
  modifyEntryExport,
  modifyEntryRuntimePlugins,
  modifyEntryRenderFunction,
  modifyFileSystemRoutes,
  modifyServerRoutes,
  htmlPartials,
  addRuntimeExports,
});

export default createPlugin(
  () => ({
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

      await (mountHook() as any).addRuntimeExports();

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

      await generateCode(appContext, resolvedConfig, entrypoints);

      const htmlTemplates = await getHtmlTemplate(entrypoints, {
        appContext,
        config: resolvedConfig,
      });

      debug(`html templates: %o`, htmlTemplates);

      AppContext.set({
        ...appContext,
        entrypoints,
        serverRoutes: routes,
        htmlTemplates,
      });
    },
  }),
  { name: '@modern-js/plugin-analyze' },
);
