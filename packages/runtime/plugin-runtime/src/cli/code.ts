import path from 'path';
import type {
  AppTools,
  IAppContext,
  AppNormalizedConfig,
  NormalizedConfig,
  RuntimePlugin,
} from '@modern-js/app-tools';
import { MAIN_ENTRY_NAME, fs } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types';
import type { MaybeAsync } from '@modern-js/plugin';
import {
  INDEX_FILE_NAME,
  ENTRY_BOOTSTRAP_FILE_NAME,
  ENTRY_POINT_FILE_NAME,
  ENTRY_POINT_REGISTER_FILE_NAME,
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
  SERVER_ENTRY_POINT_FILE_NAME,
  ENTRY_SERVER_BOOTSTRAP_FILE_NAME,
} from './constants';
import * as template from './template';
import * as serverTemplate from './template.server';

function getSSRMode(
  entry: string = MAIN_ENTRY_NAME,
  config: AppNormalizedConfig,
): 'string' | 'stream' | false {
  const { ssr, ssrByEntries } = config.server;

  if (config.output.ssg) {
    return 'string';
  }

  return checkSSRMode(ssrByEntries?.[entry] || ssr);

  function checkSSRMode(ssr: AppNormalizedConfig['server']['ssr']) {
    if (!ssr) {
      return false;
    }

    if (typeof ssr === 'boolean') {
      return ssr ? 'string' : false;
    }

    return ssr.mode === 'stream' ? 'stream' : 'string';
  }
}

export const generateCode = async (
  entrypoints: Entrypoint[],
  appContext: IAppContext,
  config: NormalizedConfig<AppTools>,
  onCollectRuntimePlugins: (params: {
    entrypoint: Entrypoint;
    plugins: RuntimePlugin[];
  }) => MaybeAsync<{ entrypoint: Entrypoint; plugins: RuntimePlugin[] }>,
) => {
  const { mountId } = config.html;
  const { enableAsyncEntry } = config.source;
  const {
    runtimeConfigFile,
    internalDirectory,
    internalSrcAlias,
    metaName,
    srcDirectory,
  } = appContext;
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const {
        entryName,
        isAutoMount,
        entry,
        customEntry,
        customBootstrap,
        customServerEntry,
      } = entrypoint;
      const { plugins: runtimePlugins } = await onCollectRuntimePlugins({
        entrypoint,
        plugins: [],
      });
      if (isAutoMount) {
        // index.jsx
        const indexCode = template.index({
          srcDirectory,
          internalSrcAlias,
          metaName,
          entry,
          entryName,
          customEntry,
          customBootstrap,
          mountId,
        });
        const indexFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
        );

        fs.outputFileSync(indexFile, indexCode, 'utf8');

        const ssrMode = getSSRMode(entryName, config);

        if (enableAsyncEntry) {
          const bootstrapFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_BOOTSTRAP_FILE_NAME}`,
          );
          // bootstrap.jsx
          fs.outputFileSync(
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
            fs.outputFileSync(
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
          });
          const indexServerFile = path.resolve(
            internalDirectory,
            `./${entryName}/${SERVER_ENTRY_POINT_FILE_NAME}`,
          );

          fs.outputFileSync(indexServerFile, indexServerCode, 'utf8');
        }

        // register.js
        const registerCode = template.register();
        const registerFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_REGISTER_FILE_NAME}`,
        );
        fs.outputFileSync(registerFile, registerCode, 'utf8');

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
        fs.outputFileSync(registerRuntimeFile, registerRuntimeCode, 'utf8');

        // runtime-global-context.js
        const contextCode = template.runtimeGlobalContext({
          srcDirectory,
          internalSrcAlias,
          metaName,
          entry,
          customEntry,
        });
        const contextFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}`,
        );
        fs.outputFileSync(contextFile, contextCode, 'utf8');
      }
    }),
  );
};
