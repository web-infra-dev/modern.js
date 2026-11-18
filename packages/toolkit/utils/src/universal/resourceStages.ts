export interface ResourcePreload {
  h: string;
  a: 'script' | 'style';
  l?: 1;
  i?: string;
}

export interface SizedResourcePreload extends ResourcePreload {
  b: number;
}

export interface ResourcePreloadGroup {
  id: string | number;
  files: SizedResourcePreload[];
  css?: string[];
}

export interface ResourcePreloadBudget {
  size: number;
  requests: number;
}

/** Fit whole chunks in the budget, in priority order, counting each URL once. */
export const selectResourcePreloads = (
  groups: ResourcePreloadGroup[],
  budget: ResourcePreloadBudget,
  loaded: ReadonlySet<string> = new Set(),
  reserved: SizedResourcePreload[] = [],
) => {
  const seen = new Set(loaded);
  const reservation = new Map(reserved.map(file => [file.h, file.b]));
  let bytes = 0;
  for (const [url, size] of reservation) {
    seen.add(url);
    bytes += size;
  }
  let requests = reservation.size;
  const preloads: SizedResourcePreload[] = [];
  const overflow: ResourcePreloadGroup[] = [];
  for (const group of groups) {
    const candidates = new Map<string, SizedResourcePreload>();
    for (const file of group.files) {
      if (!seen.has(file.h)) {
        candidates.set(file.h, file);
      }
    }
    const files = [...candidates.values()];
    const size = files.reduce((total, file) => total + file.b, 0);
    if (
      bytes + size > budget.size ||
      requests + files.length > budget.requests
    ) {
      overflow.push(group);
      continue;
    }
    for (const file of files) {
      seen.add(file.h);
      preloads.push(file);
    }
    bytes += size;
    requests += files.length;
  }
  return {
    preloads,
    overflow: overflow.filter(group =>
      group.files.some(file => !seen.has(file.h)),
    ),
  };
};

export interface RoutePreloadPlan {
  declared?: ResourcePreloadGroup[];
  own?: ResourcePreloadGroup[];
  shared?: ResourcePreloadGroup[];
  /** Preloads in builds produced before page budgets. */
  c?: ResourcePreload[];
  rc?: ResourcePreload[];
}

export interface ResourcePreloadPlan {
  routeRule: boolean;
  budget?: ResourcePreloadBudget;
  entries?: Record<string, SizedResourcePreload[]>;
  routes: Record<string, RoutePreloadPlan>;
}

/** The same page budget applies to HTML preloads and to HTTP Early Hints. */
export const selectMatchedResourcePreloads = (
  plan: ResourcePreloadPlan,
  entryName: string | undefined,
  routeIds: string[],
  mode: 'stream' | 'string',
  loaded?: ReadonlySet<string>,
) => {
  const routes = routeIds.map(id => plan.routes[id]).filter(Boolean);
  const useRouteRule = plan.routeRule && mode === 'stream';
  const entry = entryName ? (plan.entries?.[entryName] ?? []) : [];
  if (!plan.budget) {
    return {
      entry,
      preloads: routes.flatMap(route => [
        ...(useRouteRule ? (route.rc ?? []) : []),
        ...(route.c ?? []),
      ]),
      overflow: [],
    };
  }

  const groups = routes.flatMap(route => route.declared ?? []);
  if (useRouteRule) {
    groups.push(
      ...routes.flatMap(route => route.own ?? []),
      ...routes.flatMap(route => route.shared ?? []),
    );
  }
  return {
    entry,
    ...selectResourcePreloads(groups, plan.budget, loaded, entry),
  };
};
