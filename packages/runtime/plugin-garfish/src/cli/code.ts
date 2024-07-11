import path from 'path';
import type {
  AppTools,
  IAppContext,
  NormalizedConfig,
} from '@modern-js/app-tools';
import { fs } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types';
import type { MaybeAsync } from '@modern-js/core';
import * as template from './template';
import { generateAsyncEntryCode } from './utils';

const ENTRY_POINT_FILE_NAME = 'index.jsx';
export const ENTRY_BOOTSTRAP_FILE_NAME = 'bootstrap.jsx';

export const generateCode = async (
  entrypoints: Entrypoint[],
  appContext: IAppContext,
  config: NormalizedConfig<AppTools>,
  appendEntryCode: (input: { entrypoint: Entrypoint }) => MaybeAsync<string[]>,
) => {
  const { mountId } = config.html;
  const { enableAsyncEntry } = config.source;
  const { internalDirectory, internalSrcAlias, metaName, srcDirectory } =
    appContext;
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const { entryName, isAutoMount, entry, customEntry, customBootstrap } =
        entrypoint;
      const appendCode = await appendEntryCode({ entrypoint });

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
          appendCode,
        });
        const indexFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
        );

        fs.outputFileSync(indexFile, indexCode, 'utf8');
        if (enableAsyncEntry) {
          const bootstrapFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_BOOTSTRAP_FILE_NAME}`,
          );
          fs.outputFileSync(
            bootstrapFile,
            generateAsyncEntryCode(appendCode),
            'utf8',
          );
        }
      }
    }),
  );
};
