import path from 'path';
import { ServerRoute } from '@modern-js/types';
import { LOADABLE_STATS_FILE } from '@modern-js/utils';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { ServerHookRunner } from '@modern-js/server-core';

const getBundles = (routes: ServerRoute[]) => {
  return routes.filter(route => route.isSSR).map(route => route.bundle);
};

const cleanSSRCache = (distDir: string, routes: ServerRoute[]) => {
  const bundles = getBundles(routes);

  bundles.forEach(bundle => {
    const filepath = path.join(distDir, bundle as string);
    if (require.cache[filepath]) {
      delete require.cache[filepath];
    }
  });

  const loadable = path.join(distDir, LOADABLE_STATS_FILE);
  if (require.cache[loadable]) {
    delete require.cache[loadable];
  }
};

export const onRepack = (
  distDir: string,
  runner: ServerHookRunner,
  routes: ServerRoute[],
) => {
  cleanSSRCache(distDir, routes);
  fileReader.reset();
  runner.reset({
    event: {
      type: 'repack',
    },
  });
};
