import path from 'path';
import type {
  AppTools,
  AppToolsContext,
  AppToolsFeatureHooks,
  NormalizedConfig,
} from '@modern-js/app-tools';
import type { CollectAsyncHook } from '@modern-js/plugin-v2';
import type { Entrypoint } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import type { AppendEntryCodeFn } from './hooks';
import * as template from './template';
import { generateAsyncEntryCode } from './utils';

const ENTRY_POINT_FILE_NAME = 'index.jsx';
export const ENTRY_BOOTSTRAP_FILE_NAME = 'bootstrap.jsx';

export const generateCode = async (
  entrypoints: Entrypoint[],
  appContext: AppToolsContext<'shared'>,
  config: NormalizedConfig<AppTools>,
  hooks: AppToolsFeatureHooks<'shared'>,
) => {
  const { mountId } = config.html;
  const { enableAsyncEntry } = config.source;
  const { internalDirectory, internalSrcAlias, metaName, srcDirectory } =
    appContext;
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const { entryName, isAutoMount, entry, customEntry, customBootstrap } =
        entrypoint;
      const appendCode = await (
        hooks.appendEntryCode as CollectAsyncHook<AppendEntryCodeFn>
      ).call({
        entrypoint,
        code: '',
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
