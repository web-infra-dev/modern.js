import path from 'path';
import { fs } from '@modern-js/utils';
import { FILE_SYSTEM_ROUTES_FILE_NAME } from './constants';

export function generatorRouteCode(
  internalDirectory: string,
  entryName: string,
  code: string,
) {
  fs.outputFileSync(
    path.resolve(
      internalDirectory,
      `./${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME}`,
    ),
    code,
    'utf8',
  );
}
