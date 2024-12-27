import type { PluginRunner } from '../plugin';

import type { SSRMode } from '@modern-js/types';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type { RouteManifest } from 'src/router/runtime/types';
import { createLoaderManager } from '../loader/loaderManager';
import type { RuntimeContext } from './runtime';

export const getInitialContext = (
  runner: PluginRunner,
  // biome-ignore lint/style/useDefaultParameterLast: <explanation>
  isBrowser = true,
  // biome-ignore lint/style/useDefaultParameterLast: <explanation>
  ssrMode: SSRMode,
  routeManifest?: RouteManifest,
): RuntimeContext => ({
  loaderManager: ssrMode === 'stream' ? undefined : createLoaderManager({}),
  runner,
  isBrowser,
  routeManifest:
    routeManifest ||
    (typeof window !== 'undefined' && (window as any)[ROUTE_MANIFEST]),
});
