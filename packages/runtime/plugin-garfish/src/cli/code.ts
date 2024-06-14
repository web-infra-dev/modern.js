import path from 'path';
import type { IAppContext } from '@modern-js/app-tools';
import { fs } from '@modern-js/utils';
import * as template from './template';

const ENTRY_POINT_FILE_NAME = 'index.jsx';

export const generateCode = async (
  appContext: IAppContext,
  mountId?: string,
) => {
  const {
    internalDirectory,
    internalSrcAlias,
    metaName,
    entrypoints,
    srcDirectory,
  } = appContext;
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const { entryName, isAutoMount, entry, customEntry } = entrypoint;

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
      }
    }),
  );
};
