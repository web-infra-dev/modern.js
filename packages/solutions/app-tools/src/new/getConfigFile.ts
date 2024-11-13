import path from 'path';
import { CONFIG_FILE_EXTENSIONS, findExists } from '@modern-js/utils';
import { DEFAULT_CONFIG_FILE } from './constants';

export const getConfigFile = () =>
  findExists(
    CONFIG_FILE_EXTENSIONS.map(extension =>
      path.resolve(process.cwd(), `${DEFAULT_CONFIG_FILE}${extension}`),
    ),
  );
