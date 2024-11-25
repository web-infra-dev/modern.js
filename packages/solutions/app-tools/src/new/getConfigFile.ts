import path from 'path';
import { CONFIG_FILE_EXTENSIONS, findExists } from '@modern-js/utils';
import { DEFAULT_CONFIG_FILE } from './constants';

export const getConfigFile = (configFile?: string) =>
  findExists(
    CONFIG_FILE_EXTENSIONS.map(extension =>
      path.resolve(
        process.cwd(),
        `${configFile || DEFAULT_CONFIG_FILE}${extension}`,
      ),
    ),
  );
