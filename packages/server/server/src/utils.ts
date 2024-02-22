import { SSR } from '@modern-js/server-core';
import { ServerRoute } from '@modern-js/types';
import { createDebugger } from '@modern-js/utils';
import { ModernDevServerOptions } from './types';

export const debug = createDebugger('server');

export const isUseStreamingSSR = (routes?: ServerRoute[]) =>
  routes?.some(r => r.isStream === true);

export const isUseSSRPreload = (conf: ModernDevServerOptions['config']) => {
  const {
    server: { ssr, ssrByEntries },
  } = conf;

  const checkUsePreload = (ssr?: SSR) =>
    typeof ssr === 'object' && Boolean(ssr.preload);

  return (
    checkUsePreload(ssr) ||
    Object.values(ssrByEntries || {}).some(ssr => checkUsePreload(ssr))
  );
};
