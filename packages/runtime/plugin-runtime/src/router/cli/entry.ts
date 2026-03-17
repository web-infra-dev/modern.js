import path from 'path';
import type { Entrypoint } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { hasApp } from '../../cli/entry';
import { NESTED_ROUTES_DIR } from './constants';

export const ROUTES_DIR_META_KEY = '__modernRoutesDir';

type EntrypointWithRoutesMeta = Entrypoint & {
  [ROUTES_DIR_META_KEY]?: string;
};

export const getEntrypointRoutesDir = (entrypoint: {
  [ROUTES_DIR_META_KEY]?: string;
  nestedRoutesEntry?: string;
}) => {
  if (entrypoint[ROUTES_DIR_META_KEY]) {
    return entrypoint[ROUTES_DIR_META_KEY];
  }

  if (entrypoint.nestedRoutesEntry) {
    return path.basename(entrypoint.nestedRoutesEntry);
  }

  return null;
};

export const hasNestedRoutes = (
  dir: string,
  routesDir = NESTED_ROUTES_DIR,
) => fs.existsSync(path.join(dir, routesDir));

export const isRouteEntry = (
  dir: string,
  routesDir = NESTED_ROUTES_DIR,
) => {
  if (hasNestedRoutes(dir, routesDir)) {
    return path.join(dir, routesDir);
  }
  return false;
};

export const modifyEntrypoints = (
  entrypoints: Entrypoint[],
  routesDir = NESTED_ROUTES_DIR,
 ) => {
  return entrypoints.map(entrypoint => {
    const entrypointWithMeta = entrypoint as EntrypointWithRoutesMeta;

    if (!entrypoint.isAutoMount) {
      return entrypointWithMeta;
    }

    if (entrypoint?.isCustomSourceEntry) {
      if (entrypoint.fileSystemRoutes) {
        entrypointWithMeta.nestedRoutesEntry =
          entrypoint.absoluteEntryDir || entrypoint.entry;
        entrypointWithMeta[ROUTES_DIR_META_KEY] = routesDir;
      }
      return entrypointWithMeta;
    }

    const isHasApp = hasApp(entrypoint.absoluteEntryDir!);
    if (isHasApp) {
      return entrypointWithMeta;
    }
    const isHasNestedRoutes = hasNestedRoutes(
      entrypoint.absoluteEntryDir!,
      routesDir,
    );
    if (isHasNestedRoutes) {
      entrypointWithMeta.nestedRoutesEntry = path.join(
        entrypoint.absoluteEntryDir!,
        routesDir,
      );
      entrypointWithMeta[ROUTES_DIR_META_KEY] = routesDir;
    }
    return entrypointWithMeta;
  });
};