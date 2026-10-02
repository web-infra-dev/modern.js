import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { TInternalRuntimeContext } from '../../core/context/runtime';
import type {
  InternalRouterRuntimeState,
  InternalRouterServerSnapshot,
  RouterFramework,
  RouterRouteMatchSnapshot,
  RouterServerPrepareResult,
} from './types';

export type RouterLifecyclePhase = 'ssr-prepare' | 'client-create' | 'hydrate';

export type RouterLifecycleContext = {
  framework: RouterFramework;
  phase: RouterLifecyclePhase;
  routes: RouteObject[];
  runtimeContext: TInternalRuntimeContext;
  basename?: string;
  hydrationData?: unknown;
  router?: unknown;
  matches?: RouterRouteMatchSnapshot[];
  cleanup?: () => void | Promise<void>;
  serverSnapshot?: InternalRouterServerSnapshot;
};

type RouterSnapshotLike = Partial<InternalRouterServerSnapshot>;

function toHydrationScripts(state: {
  hydrationScript?: string;
  hydrationScripts?: string[];
}) {
  if (state.hydrationScripts?.length) {
    return state.hydrationScripts;
  }

  return state.hydrationScript ? [state.hydrationScript] : undefined;
}

function getMatchedRouteIdsFromMatches(matches?: RouterRouteMatchSnapshot[]) {
  const routeIds = matches
    ?.map(match => match.assetRouteId ?? match.routeId)
    .filter((routeId): routeId is string => typeof routeId === 'string');

  return routeIds?.length ? routeIds : undefined;
}

export function createRouterServerSnapshot(
  state: RouterSnapshotLike,
): InternalRouterServerSnapshot {
  const hydrationScripts = toHydrationScripts(state);
  const matchedRouteIds =
    state.matchedRouteIds ?? getMatchedRouteIdsFromMatches(state.matches);

  return {
    ...state,
    ...(hydrationScripts?.length
      ? {
          hydrationScript: state.hydrationScript ?? hydrationScripts[0],
          hydrationScripts,
        }
      : {}),
    ...(matchedRouteIds ? { matchedRouteIds } : {}),
  };
}

export function createRouterRuntimeState(
  state: InternalRouterRuntimeState,
): InternalRouterRuntimeState {
  const hasSnapshotState =
    Boolean(state.serverSnapshot) ||
    Boolean(state.hydrationScript) ||
    Boolean(state.hydrationScripts?.length) ||
    Boolean(state.matchedRouteIds?.length) ||
    Boolean(state.matches?.length);
  const serverSnapshot = state.serverSnapshot
    ? createRouterServerSnapshot({
        ...state.serverSnapshot,
        framework: state.serverSnapshot.framework ?? state.framework,
        basename: state.serverSnapshot.basename ?? state.basename,
        hydrationScript:
          state.serverSnapshot.hydrationScript ?? state.hydrationScript,
        hydrationScripts:
          state.serverSnapshot.hydrationScripts ?? state.hydrationScripts,
        matchedRouteIds:
          state.serverSnapshot.matchedRouteIds ?? state.matchedRouteIds,
        matches: state.serverSnapshot.matches ?? state.matches,
      })
    : hasSnapshotState
      ? createRouterServerSnapshot({
          framework: state.framework,
          basename: state.basename,
          hydrationScript: state.hydrationScript,
          hydrationScripts: state.hydrationScripts,
          matchedRouteIds: state.matchedRouteIds,
          matches: state.matches,
        })
      : undefined;
  const hydrationScripts = toHydrationScripts({
    hydrationScript: state.hydrationScript ?? serverSnapshot?.hydrationScript,
    hydrationScripts:
      state.hydrationScripts ?? serverSnapshot?.hydrationScripts,
  });
  const matchedRouteIds =
    state.matchedRouteIds ??
    serverSnapshot?.matchedRouteIds ??
    getMatchedRouteIdsFromMatches(state.matches);

  return {
    ...state,
    ...(hydrationScripts?.length
      ? {
          hydrationScript: state.hydrationScript ?? hydrationScripts[0],
          hydrationScripts,
        }
      : {}),
    ...(matchedRouteIds ? { matchedRouteIds } : {}),
    ...(serverSnapshot ? { serverSnapshot } : {}),
  };
}

export function applyRouterRuntimeState(
  runtimeContext: TInternalRuntimeContext,
  state: InternalRouterRuntimeState,
) {
  const normalized = createRouterRuntimeState(state);
  runtimeContext.routerFramework = normalized.framework;
  runtimeContext.routerInstance = normalized.instance;
  runtimeContext.routerHydrationScript = normalized.hydrationScript;
  runtimeContext.routerMatchedRouteIds = normalized.matchedRouteIds;
  runtimeContext.routerRuntime = normalized;
  if (normalized.serverSnapshot) {
    runtimeContext.routerServerSnapshot = normalized.serverSnapshot;
  }

  return runtimeContext;
}

export function applyRouterServerPrepareResult(
  runtimeContext: TInternalRuntimeContext,
  result: RouterServerPrepareResult,
) {
  const state = createRouterRuntimeState({
    ...result.state,
    cleanup: result.cleanup ?? result.state.cleanup,
    serverSnapshot: result.snapshot ?? result.state.serverSnapshot,
  });
  applyRouterRuntimeState(runtimeContext, state);
  return runtimeContext;
}

export function getRouterHydrationScripts(
  runtimeContext: TInternalRuntimeContext,
) {
  return (
    runtimeContext.routerServerSnapshot?.hydrationScripts ??
    toHydrationScripts({
      hydrationScript: runtimeContext.routerServerSnapshot?.hydrationScript,
    }) ??
    runtimeContext.routerRuntime?.hydrationScripts ??
    toHydrationScripts({
      hydrationScript:
        runtimeContext.routerRuntime?.hydrationScript ??
        runtimeContext.routerHydrationScript,
    }) ??
    []
  );
}

export function getRouterMatchedRouteIds(
  runtimeContext: TInternalRuntimeContext,
) {
  return (
    runtimeContext.routerServerSnapshot?.matchedRouteIds ??
    getMatchedRouteIdsFromMatches(
      runtimeContext.routerServerSnapshot?.matches,
    ) ??
    runtimeContext.routerRuntime?.matchedRouteIds ??
    getMatchedRouteIdsFromMatches(runtimeContext.routerRuntime?.matches) ??
    runtimeContext.routerMatchedRouteIds
  );
}

export async function cleanupRouterRuntimeState(
  runtimeContext: TInternalRuntimeContext,
) {
  try {
    await runtimeContext.routerRuntime?.cleanup?.();
  } catch {}
}
