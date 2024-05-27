import path from 'path';
import type { IAppContext, AppNormalizedConfig } from '@modern-js/app-tools-v2';
import { fs } from '@modern-js/utils';
import { safeReplacer } from './utils/config';
import {
  ENTRY_POINT_REGISTER_FILE_NAME,
  ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME,
  ENTRY_POINT_RUNTIME_REGISTER_FILE_NAME,
  ENTRY_RUNTIME_CONFIG_FILE_NAME,
} from './constants';
import * as template from './template';

export const generateCode = async ({
  appContext,
  config,
}: {
  appContext: IAppContext;
  config: AppNormalizedConfig<'shared'>;
}) => {
  const {
    runtimeConfigFile,
    internalDirectory,
    internalSrcAlias,
    metaName,
    entrypoints,
    srcDirectory,
  } = appContext;

  await Promise.all(
    entrypoints.map(async entrypoint => {
      const { entryName, isAutoMount, entry } = entrypoint;

      if (isAutoMount) {
        // // index.jsx
        // const indexCode = template.index({
        //   srcDirectory,
        //   internalSrcAlias,
        //   entryName,
        //   entry,
        // });
        // const indexFile = path.resolve(
        //   internalDirectory,
        //   `./${entryName}/${ENTRY_POINT_INDEX_FILE_NAME}`,
        // );
        // fs.outputFileSync(indexFile, indexCode, 'utf8');

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
        });
        const contextFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}`,
        );
        fs.outputFileSync(contextFile, contextCode, 'utf8');

        // runtime-config.json
        const configFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_RUNTIME_CONFIG_FILE_NAME}`,
        );
        await fs.writeJSON(
          configFile,
          {
            runtime: config.runtime,
            runtimeByEntries: config.runtimeByEntries,
          },
          {
            spaces: 2,
            replacer: safeReplacer(),
          },
        );
      }
    }),
  );
};
