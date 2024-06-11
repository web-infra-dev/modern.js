import path from 'path';
import { createDebugger, findExists, fs } from '@modern-js/utils';
import {
  JS_EXTENSIONS,
  FILE_SYSTEM_ROUTES_LAYOUT,
  FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT,
  FILE_SYSTEM_ROUTES_IGNORED_REGEX,
} from '../constants';

const debug = createDebugger('get-client-routes');

export { debug };

export const findLayout = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext =>
      path.resolve(dir, `${FILE_SYSTEM_ROUTES_LAYOUT}${ext}`),
    ),
  );

export const getRouteWeight = (route: string) =>
  route === '*' ? 999 : route.split(':').length - 1;

export const shouldSkip = (file: string): boolean => {
  // should not skip directory.
  if (fs.statSync(file).isDirectory()) {
    return false;
  }

  const ext = path.extname(file);

  if (
    FILE_SYSTEM_ROUTES_IGNORED_REGEX.test(file) ||
    !JS_EXTENSIONS.includes(ext) ||
    FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT === path.basename(file, ext)
  ) {
    return true;
  }

  return false;
};
