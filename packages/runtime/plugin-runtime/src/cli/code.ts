import path from 'path';
import type {
  AppToolsContext,
  AppToolsFeatureHooks,
  AppToolsNormalizedConfig,
} from '@modern-js/app-tools';
import type { Entrypoint } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import {
  ENTRY_BOOTSTRAP_FILE_NAME,
  ENTRY_POINT_FILE_NAME,
  ENTRY_POINT_REGISTER_FILE_NAME,
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
  ENTRY_SERVER_BOOTSTRAP_FILE_NAME,
  INDEX_FILE_NAME,
  SERVER_ENTRY_POINT_FILE_NAME,
} from './constants';
import { resolveSSRMode } from './ssr/mode';
import * as template from './template';
import * as serverTemplate from './template.server';

export const generateCode = async (
  entrypoints: Entrypoint[],
  appContext: AppToolsContext,
  config: AppToolsNormalizedConfig,
  hooks: AppToolsFeatureHooks,
) => {
  const { mountId } = config.html;
  const { enableAsyncEntry } = config.source;
  const {
    runtimeConfigFile,
    internalDirectory,
    internalSrcAlias,
    metaName,
    srcDirectory,
    serverRoutes,
  } = appContext;
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const {
        entryName,
        isAutoMount,
        entry,
        customEntry,
        customServerEntry,
        nestedRoutesEntry,
      } = entrypoint;
      const { plugins: runtimePlugins } =
        await hooks._internalRuntimePlugins.call({
          entrypoint,
          plugins: [],
        });
      if (isAutoMount) {
        const ssrMode = resolveSSRMode({
          entry: entryName,
          config,
          nestedRoutesEntry,
        });
        let indexCode = '';
        // index.jsx
        if (!ssrMode && config.server.rsc) {
          indexCode = template.entryForCSRWithRSC({
            metaName,
            entryName,
            mountId,
            urlPath: serverRoutes.find(route => route.entryName === entryName)
              ?.urlPath,
            isNestedRouter: entrypoint.nestedRoutesEntry,
          });
        } else {
          indexCode = template.index({
            srcDirectory,
            internalSrcAlias,
            metaName,
            entry,
            entryName,
            customEntry,
            mountId,
            enableRsc: config.server.rsc,
            isNestedRouter: !!entrypoint.nestedRoutesEntry,
          });
        }

        const indexFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
        );

        await fs.outputFile(indexFile, indexCode, 'utf8');

        if (enableAsyncEntry) {
          const bootstrapFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_BOOTSTRAP_FILE_NAME}`,
          );
          // bootstrap.jsx
          await fs.outputFile(
            bootstrapFile,
            `import(/* webpackChunkName: "async-${entryName}" */ './${INDEX_FILE_NAME}');`,
            'utf8',
          );

          const bootstrapServerFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_SERVER_BOOTSTRAP_FILE_NAME}`,
          );

          if (ssrMode) {
            // bootstrap.server.jsx
            await fs.outputFile(
              bootstrapServerFile,
              `export const requestHandler = import('./${SERVER_ENTRY_POINT_FILE_NAME}').then((m) => m.requestHandler)`,
              'utf8',
            );
          }
        }

        if (ssrMode) {
          // index.server.js
          const indexServerCode = serverTemplate.serverIndex({
            entry,
            entryName,
            internalSrcAlias,
            metaName,
            mode: ssrMode,
            customServerEntry,
            srcDirectory,
            enableRsc: config.server.rsc,
          });
          const indexServerFile = path.resolve(
            internalDirectory,
            `./${entryName}/${SERVER_ENTRY_POINT_FILE_NAME}`,
          );

          await fs.outputFile(indexServerFile, indexServerCode, 'utf8');
        } else if (config.server.rsc) {
          const indexServerFile = path.resolve(
            internalDirectory,
            `./${entryName}/${SERVER_ENTRY_POINT_FILE_NAME}`,
          );

          const indexServerCode = serverTemplate.entryForCSRWithRSC({
            entryName,
            metaName,
          });
          await fs.outputFile(indexServerFile, indexServerCode, 'utf8');
        }

        // register.js
        const registerCode = template.register();
        const registerFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_REGISTER_FILE_NAME}`,
        );
        await fs.outputFile(registerFile, registerCode, 'utf8');

        // runtime-register.js
        const registerRuntimeCode = template.runtimeRegister({
          entryName,
          srcDirectory,
          internalSrcAlias,
          metaName,
          runtimeConfigFile,
          runtimePlugins,
        });
        const registerRuntimeFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME}`,
        );
        await fs.outputFile(registerRuntimeFile, registerRuntimeCode, 'utf8');

        // runtime-global-context.js
        let contextCode = '';
        if (!config.server.rsc || entrypoint.nestedRoutesEntry) {
          const route = serverRoutes.find(r => r.entryName === entryName);
          const basename = route?.urlPath || '/';
          contextCode = template.runtimeGlobalContext({
            entryName,
            srcDirectory,
            internalSrcAlias,
            metaName,
            entry,
            customEntry,
            basename,
          });
        } else {
          const AppProxyPath = path.join(
            internalDirectory,
            entryName,
            './AppProxy.jsx',
          );
          const appProxyCode = template.AppProxyForRSC({
            srcDirectory,
            internalSrcAlias,
            entry,
            customEntry,
          });
          await fs.outputFile(AppProxyPath, appProxyCode);
          contextCode = template.runtimeGlobalContextForRSCClient({
            metaName,
          });
          const contextServerCode = template.runtimeGlobalContextForRSCServer({
            metaName,
          });
          const contextFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}.server.js`,
          );
          await fs.outputFile(contextFile, contextServerCode, 'utf8');
        }
        const contextFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}.js`,
        );
        await fs.outputFile(contextFile, contextCode, 'utf8');
      }
    }),
  );
};
