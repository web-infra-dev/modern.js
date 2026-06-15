import type { EagerRouteComponentFilesByEntry } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/plugin';

export type BuilderOptions = {
  normalizedConfig: AppNormalizedConfig;
  appContext: AppToolsContext;
  /**
   * Route component files collected from the FINAL file-system routes (after
   * all `modifyFileSystemRoutes` consumers ran), keyed by entry name. Populated
   * by the router plugin during route generation and threaded in here (read
   * FRESH from the app context AFTER `generateEntryCode` runs) so the SSR
   * builder plugin can force route component chunks eager under lazy
   * compilation. Explicit param instead of a direct `_internalContext` read.
   */
  eagerRouteComponentFilesByEntry?: EagerRouteComponentFilesByEntry;
};
