import path from 'path';
import type { Entrypoint } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { hasApp } from '../../cli/entry';
import { NESTED_ROUTES_DIR } from './constants';

export const hasNestedRoutes = (dir: string) =>
  fs.existsSync(path.join(dir, NESTED_ROUTES_DIR));

export const isRouteEntry = (dir: string) => {
  if (hasNestedRoutes(dir)) {
    return path.join(dir, NESTED_ROUTES_DIR);
  }
  return false;
};

export const modifyEntrypoints = (entrypoints: Entrypoint[]) => {
  return entrypoints.map(entrypoint => {
    if (!entrypoint.isAutoMount) {
      return entrypoint;
    }
    if (entrypoint?.isCustomSourceEntry) {
      if (entrypoint.fileSystemRoutes) {
        entrypoint.nestedRoutesEntry =
          entrypoint.absoluteEntryDir || entrypoint.entry;
      }
      return entrypoint;
    }
    const isHasApp = hasApp(entrypoint.absoluteEntryDir!);
    if (isHasApp) {
      return entrypoint;
    }
    const isHasNestedRoutes = hasNestedRoutes(entrypoint.absoluteEntryDir!);
    if (isHasNestedRoutes) {
      entrypoint.nestedRoutesEntry = path.join(
        entrypoint.absoluteEntryDir!,
        NESTED_ROUTES_DIR,
      );
    }
    return entrypoint;
  });
};
