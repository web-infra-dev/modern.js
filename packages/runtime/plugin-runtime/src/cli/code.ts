import path from 'path';
import type { AppTools, IAppContext, PluginAPI } from '@modern-js/app-tools';
import { fs } from '@modern-js/utils';
import {
  ENTRY_POINT_FILE_NAME,
  ENTRY_POINT_REGISTER_FILE_NAME,
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
} from './constants';
import * as template from './template';

export const generateCode = async (
  api: PluginAPI<AppTools>,
  appContext: IAppContext,
  mountId?: string,
) => {
  const {
    runtimeConfigFile,
    internalDirectory,
    internalSrcAlias,
    metaName,
    entrypoints,
    srcDirectory,
  } = appContext;
  const runner = api.useHookRunners();
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const { entryName, isAutoMount, entry, customEntry } = entrypoint;
      const { plugins: runtimePlugins } = await runner._internalRuntimePlugins({
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
          mountId,
        });
        const indexFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
        );
        fs.outputFileSync(indexFile, indexCode, 'utf8');

        // register.js
        const registerCode = template.register();
        const registerFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_REGISTER_FILE_NAME}`,
        );
        fs.outputFileSync(registerFile, registerCode, 'utf8');

        // runtime-register.js
        const registerRuntimeCode = template.runtimeRegister({
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
