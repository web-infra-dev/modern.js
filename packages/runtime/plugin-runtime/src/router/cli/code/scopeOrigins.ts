import type { NestedRouteForCli } from '@modern-js/types';

/** Build-only provenance for transparent definitions folded by optimizeRoute. */
export type ScopeRoute = NestedRouteForCli & {
  _scopeAncestors?: { id: string; path: string }[];
};
