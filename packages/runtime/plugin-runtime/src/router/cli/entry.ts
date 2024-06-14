import path from 'path';
import { JS_EXTENSIONS, findExists, fs, isRouterV5 } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types';
import {
  FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT,
  NESTED_ROUTES_DIR,
  PAGES_DIR_NAME,
} from './constants';

export const hasPages = (dir: string) =>
  fs.existsSync(path.join(dir, PAGES_DIR_NAME));

export const hasNestedRoutes = (dir: string) =>
  fs.existsSync(path.join(dir, NESTED_ROUTES_DIR));

export const isRouteEntry = (dir: string) => {
  if (hasNestedRoutes(dir)) {
    return path.join(dir, NESTED_ROUTES_DIR);
  }
  if (hasPages(dir)) {
    return path.join(dir, PAGES_DIR_NAME);
  }
  return false;
};

export const modifyEntrypoints = (
  entrypoints: Entrypoint[],
  config: Record<string, any> = {},
) => {
  return entrypoints.map(entrypoint => {
    const isHasNestedRoutes = hasNestedRoutes(entrypoint.absoluteEntryDir!);
    const isHasPages = hasPages(entrypoint.absoluteEntryDir!);
    if (!isHasNestedRoutes && !isHasPages) {
      return entrypoint;
    }
    // When the user configures a custom entry, and the entry path is a folder, fileSystemRoutes will be set to true during entry recognition.
    // At this time, the `routes` will be used by default, and react router v5 is not supported.
    if (entrypoint.fileSystemRoutes && !isRouterV5(config)) {
      entrypoint.nestedRoutesEntry = entrypoint.entry;
    } else if (!entrypoint.fileSystemRoutes) {
      entrypoint.fileSystemRoutes = {
        globalApp: findExists(
          JS_EXTENSIONS.map(ext =>
            path.resolve(
              entrypoint.absoluteEntryDir!,
              `./${PAGES_DIR_NAME}/${FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT}${ext}`,
            ),
          ),
        ),
      };
      if (isHasPages) {
        entrypoint.pageRoutesEntry = path.join(
          entrypoint.absoluteEntryDir!,
          PAGES_DIR_NAME,
        );
      }
      if (isHasNestedRoutes) {
        entrypoint.nestedRoutesEntry = path.join(
          entrypoint.absoluteEntryDir!,
          NESTED_ROUTES_DIR,
        );
      }
    } else {
      throw Error(
        'Custom entries with conventional routing not support use react router v5!',
      );
    }

    return entrypoint;
  });
};
