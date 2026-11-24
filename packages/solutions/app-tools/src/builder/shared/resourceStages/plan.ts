import {
  type ResourcePreload as PreloadItem,
  type ResourcePreloadGroup,
  type SizedResourcePreload,
  selectResourcePreloads,
} from '@modern-js/utils/universal';
import {
  ELEMENT_STAGES,
  type NormalizedResourceStages,
  estimateDownloadTime,
  parseSize,
} from './config';

export type ChunkId = string | number;

export interface ChunkInfo {
  id: ChunkId;
  /** JS files, with the public path. */
  js: string[];
  /** CSS files, with the public path. */
  css: string[];
  /**
   * CSS files without the public path, for the stage lists: the browser adds
   * the public path of the bundler runtime, which also covers
   * `assetPrefix: 'auto'` and a public path changed at runtime.
   */
  cssFiles?: string[];
  /** Compressed bytes of all files. */
  size: number;
  /** Compressed bytes by file URL. */
  fileSizes?: Record<string, number>;
  /**
   * File URL -> `integrity` of the file, when the build outputs Subresource
   * Integrity hashes (`security.sri`).
   */
  integrity?: Record<string, string>;
}

export interface EntryInfo {
  /** Chunks the entry loads with `<script>` / `<link>`. */
  initial: Set<ChunkId>;
  /** Every chunk reachable from the entry. */
  reachable: Set<ChunkId>;
  /** The server renders the entry, so it adds the route lists per request. */
  serverRendered: boolean;
  /** Streaming SSR, the only mode that applies the route JS rule. */
  streaming?: boolean;
}

export interface RouteInfo {
  entry: string;
  /** Chunks of the route's chunk group, in group order. */
  chunks: ChunkId[];
  /** Chunks named after the route, i.e. the route module itself. */
  own: Set<ChunkId>;
  /** Every chunk reachable from the route's chunk group. */
  reachable: Set<ChunkId>;
}

export interface DeclarationInfo {
  stage: string;
  file: string;
  line: number;
  request: string;
  /** Chunks of the async chunk group(s) the `import()` creates. */
  chunks: ChunkId[];
  /** Async levels from the entry to the declared chunk group. */
  depth: number;
  /** Chunks that contain the declaring module. */
  declaringChunks: ChunkId[];
}

export interface Snapshot {
  chunks: Map<ChunkId, ChunkInfo>;
  entries: Map<string, EntryInfo>;
  routes: Map<string, RouteInfo>;
  declarations: DeclarationInfo[];
}

export type { PreloadItem };

export interface StageStats {
  bytes: number;
  requests: number;
  depth: number;
  time: number;
}

export interface TargetPlan {
  kind: 'entry' | 'route';
  name: string;
  entry: string;
  /** Preloads within this target's budget, used for build diagnostics. */
  critical: SizedResourcePreload[];
  /** Critical candidates combined with the rest of the page on the server. */
  declaredCritical: ResourcePreloadGroup[];
  ownCritical: ResourcePreloadGroup[];
  sharedCritical: ResourcePreloadGroup[];
  /** Declared stage -> chunk ids. */
  lists: Record<string, ChunkId[]>;
  /** Route JS the route rule moved to a later stage. */
  routeLists: Record<string, ChunkId[]>;
  /** Chunk id in the lists -> URLs of its CSS files. */
  css: Record<string, string[]>;
  stats: Record<string, StageStats>;
}

export interface Plan {
  targets: TargetPlan[];
  warnings: string[];
  /** Duplicate modules are filled in by the caller, which owns the module graph. */
  declarations: (DeclarationInfo & { level: string[] })[];
  /** Budget of the HTML preloads of a page. */
  budget: { size: number; requests: number };
}

const DEFAULT_CRITICAL_REQUESTS = 8;

/** Rank of a stage in download order; `critical` first. */
export const createStageRank = (order: string[]) => (stage: string) =>
  stage === 'critical'
    ? 0
    : order.indexOf(stage) + 1 || Number.MAX_SAFE_INTEGER;

/**
 * Preloads of a chunk's files. The bundler runtime loads a chunk with
 * `integrity` when the build has Subresource Integrity hashes, and the browser
 * only reuses a preload whose `integrity` matches, so the hash goes with it.
 */
const toPreloads = (
  chunk: ChunkInfo,
  { low = false, css = true }: { low?: boolean; css?: boolean } = {},
): ResourcePreloadGroup => {
  const { integrity } = chunk;
  const toItem = (h: string, a: PreloadItem['a']): SizedResourcePreload => ({
    h,
    a,
    b:
      chunk.fileSizes?.[h] ?? chunk.size / (chunk.js.length + chunk.css.length),
    ...(low ? { l: 1 as const } : {}),
    ...(integrity?.[h] ? { i: integrity[h] } : {}),
  });
  return {
    id: chunk.id,
    files: [
      ...chunk.js.map(h => toItem(h, 'script')),
      ...(css ? chunk.css.map(h => toItem(h, 'style')) : []),
    ],
    // Without CSS (route JS, whose CSS the router loads) a group that
    // overflows to a later stage must not carry CSS into that stage either.
    ...(css && chunk.css.length ? { css: chunk.cssFiles ?? chunk.css } : {}),
  };
};

/**
 * Default `critical` budget: what the target network downloads in a third of
 * the first paint target, the rest is left to the entry files.
 */
export const getCriticalBudget = (stages: NormalizedResourceStages) => {
  const configured = stages.config.budget?.critical;
  const derived = Math.round(
    (stages.network.downlink * 1_000_000 * (stages.firstPaintTarget / 3)) /
      8 /
      1000,
  );
  return {
    size: parseSize(configured?.size) ?? derived,
    requests: configured?.requests ?? DEFAULT_CRITICAL_REQUESTS,
  };
};

/**
 * Work out, for each entry and each route, which files are preloaded from the
 * HTML (`critical`) and which chunk ids are prefetched at which stage.
 *
 * - A chunk declared in several stages takes the earliest one.
 * - Files the entry already loads are left out.
 * - A declaration belongs to the route whose chunks contain the declaring
 *   module; declarations in the entry's own chunks, or in chunks no single
 *   route owns, belong to the entry.
 * - Route JS (streaming SSR, when enabled): the route's own chunk is
 *   `critical`; its shared chunks fill the `critical` budget in group order,
 *   the rest goes to `visible`. Every route JS preload has a low fetch
 *   priority, so it does not compete with the entry scripts and stylesheets.
 *   Route CSS is not preloaded: streaming SSR already outputs it as
 *   `<link rel="stylesheet">`.
 */
export const planResourceStages = (
  snapshot: Snapshot,
  stages: NormalizedResourceStages,
  options: {
    routeRule: boolean;
    /** No HTML preloads (`assetPrefix: 'auto'`): `critical` goes to the first stage. */
    noPreload?: boolean;
  },
): Plan => {
  const warnings: string[] = [];
  const rank = createStageRank(stages.order);
  const elementStages = new Set<string>(ELEMENT_STAGES);

  type Target = {
    plan: TargetPlan;
    /** Chunk id -> declared stage. */
    declared: Map<ChunkId, string>;
    depth: Map<string, number>;
  };
  const targets = new Map<string, Target>();
  const getTarget = (kind: 'entry' | 'route', name: string, entry: string) => {
    const key = `${kind}:${name}`;
    let target = targets.get(key);
    if (!target) {
      target = {
        plan: {
          kind,
          name,
          entry,
          critical: [],
          declaredCritical: [],
          ownCritical: [],
          sharedCritical: [],
          lists: {},
          routeLists: {},
          css: {},
          stats: {},
        },
        declared: new Map(),
        depth: new Map(),
      };
      targets.set(key, target);
    }
    return target;
  };

  const declarations: Plan['declarations'] = [];
  for (const declaration of snapshot.declarations) {
    const level: string[] = [];
    declarations.push({ ...declaration, level });
    if (!declaration.chunks.length) {
      warnings.push(
        `${declaration.file}:${declaration.line}: import('${declaration.request}') is not split into a separate chunk, so stagedImport.${declaration.stage} has no effect.`,
      );
      continue;
    }
    // Element stages are prefetched at runtime when the element triggers, so
    // they only get a level for the report.
    const isElementStage = elementStages.has(declaration.stage);

    for (const [entryName, entry] of snapshot.entries) {
      const declaring = declaration.declaringChunks.filter(id =>
        entry.reachable.has(id),
      );
      if (!declaring.length) {
        continue;
      }
      const inEntryChunks = declaring.some(id => entry.initial.has(id));
      const routeNames = inEntryChunks
        ? []
        : [...snapshot.routes]
            .filter(
              ([, route]) =>
                route.entry === entryName &&
                declaring.every(id => route.reachable.has(id)),
            )
            .map(([name]) => name);
      const ownerKeys: ['entry' | 'route', string][] = routeNames.length
        ? routeNames.map(name => ['route', name])
        : [['entry', entryName]];
      if (isElementStage) {
        for (const [kind, name] of ownerKeys) {
          level.push(`${kind}:${name}`);
        }
        continue;
      }
      const owners = ownerKeys.map(([kind, name]) =>
        getTarget(kind, name, entryName),
      );
      for (const owner of owners) {
        level.push(`${owner.plan.kind}:${owner.plan.name}`);
        for (const chunkId of declaration.chunks) {
          if (entry.initial.has(chunkId)) {
            continue;
          }
          const current = owner.declared.get(chunkId);
          if (!current || rank(declaration.stage) < rank(current)) {
            owner.declared.set(chunkId, declaration.stage);
          }
        }
        owner.depth.set(
          declaration.stage,
          Math.max(owner.depth.get(declaration.stage) ?? 0, declaration.depth),
        );
      }
    }
  }

  // An entry level declaration applies to every route of the entry, so the
  // route lists drop chunks the entry already handles at the same or an
  // earlier stage.
  for (const target of targets.values()) {
    if (target.plan.kind !== 'route') {
      continue;
    }
    const entryTarget = targets.get(`entry:${target.plan.entry}`);
    if (!entryTarget) {
      continue;
    }
    for (const [chunkId, stage] of target.declared) {
      const entryStage = entryTarget.declared.get(chunkId);
      if (entryStage && rank(entryStage) <= rank(stage)) {
        target.declared.delete(chunkId);
      }
    }
  }

  const budget = options.noPreload
    ? { size: 0, requests: 0 }
    : getCriticalBudget(stages);
  if (options.routeRule) {
    const routeConfig =
      typeof stages.config.routes === 'object' ? stages.config.routes : {};
    for (const [routeName, route] of snapshot.routes) {
      const override = routeConfig[routeName];
      if (override === false) {
        continue;
      }
      const entry = snapshot.entries.get(route.entry);
      // Only streaming SSR outputs route JS from the rule; client rendering
      // and string SSR load it as before.
      if (!entry?.serverRendered || !entry.streaming) {
        continue;
      }
      const target = getTarget('route', routeName, route.entry);
      const entryTarget = targets.get(`entry:${route.entry}`);
      const ordered = [
        ...route.chunks.filter(id => route.own.has(id)),
        ...route.chunks.filter(id => !route.own.has(id)),
      ];
      for (const chunkId of ordered) {
        const chunk = snapshot.chunks.get(chunkId);
        if (
          !chunk ||
          entry?.initial.has(chunkId) ||
          target.declared.get(chunkId) === 'critical' ||
          entryTarget?.declared.get(chunkId) === 'critical'
        ) {
          continue;
        }
        const stage = override || 'critical';
        if (stage === 'critical') {
          if (chunk.js.length) {
            const groups = route.own.has(chunkId)
              ? target.plan.ownCritical
              : target.plan.sharedCritical;
            groups.push(toPreloads(chunk, { low: true, css: false }));
          }
        } else {
          const declared = target.declared.get(chunkId);
          if (declared && rank(declared) <= rank(stage)) {
            continue;
          }
          (target.plan.routeLists[stage] ??= []).push(chunkId);
        }
      }
    }
  }

  for (const target of targets.values()) {
    const { plan } = target;
    const css: Record<string, string[]> = {};
    const byStage = new Map<string, ChunkId[]>();
    for (const [chunkId, stage] of target.declared) {
      const chunk = snapshot.chunks.get(chunkId);
      if (!chunk) {
        continue;
      }
      if (stage === 'critical') {
        plan.declaredCritical.push(toPreloads(chunk));
        continue;
      }
      (plan.lists[stage] ??= []).push(chunkId);
      if (chunk.css.length) {
        css[String(chunkId)] = chunk.cssFiles ?? chunk.css;
      }
      byStage.set(stage, [...(byStage.get(stage) ?? []), chunkId]);
    }

    // Entry preloads can be written directly into the template. Route plans
    // are combined per request, after all the matched routes are known.
    const { preloads, overflow } = selectResourcePreloads(
      [...plan.declaredCritical, ...plan.ownCritical, ...plan.sharedCritical],
      budget,
    );
    plan.critical = preloads;
    if (plan.kind === 'entry') {
      for (const group of overflow) {
        (plan.lists.visible ??= []).push(group.id);
        if (group.css) {
          css[String(group.id)] = group.css;
        }
      }
    }
    if (overflow.length) {
      byStage.set('visible', [
        ...(byStage.get('visible') ?? []),
        ...overflow.map(group => group.id),
      ]);
      const declarationsOverBudget = overflow.filter(group =>
        plan.declaredCritical.includes(group),
      ).length;
      const routeJsOverBudget = overflow.length - declarationsOverBudget;
      const fallback =
        plan.kind === 'entry'
          ? 'are prefetched at "visible" instead'
          : 'are prefetched at "visible" instead when the page has no room left for them';
      if (!options.noPreload && declarationsOverBudget) {
        warnings.push(
          `${plan.kind} "${plan.name}": ${declarationsOverBudget} chunks declared "critical" exceed the critical budget (${formatBytes(budget.size)}, ${budget.requests} requests) and ${fallback}.`,
        );
      }
      if (!options.noPreload && routeJsOverBudget) {
        warnings.push(
          `${plan.kind} "${plan.name}": ${routeJsOverBudget} route JS chunks exceed the critical budget (${formatBytes(budget.size)}, ${budget.requests} requests) and ${fallback}.`,
        );
      }
    }
    for (const [stage, chunkIds] of Object.entries(plan.routeLists)) {
      for (const chunkId of chunkIds) {
        const chunk = snapshot.chunks.get(chunkId);
        if (chunk?.css.length) {
          css[String(chunkId)] = chunk.cssFiles ?? chunk.css;
        }
      }
      byStage.set(stage, [...(byStage.get(stage) ?? []), ...chunkIds]);
    }
    plan.css = css;

    if (preloads.length) {
      byStage.set('critical', []);
    }
    for (const [stage, chunkIds] of byStage) {
      const chunks = [...new Set(chunkIds)]
        .map(id => snapshot.chunks.get(id))
        .filter((chunk): chunk is ChunkInfo => Boolean(chunk));
      const bytes =
        stage === 'critical'
          ? preloads.reduce((sum, file) => sum + file.b, 0)
          : chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const requests =
        stage === 'critical'
          ? preloads.length
          : chunks.reduce(
              (sum, chunk) => sum + chunk.js.length + chunk.css.length,
              0,
            );
      plan.stats[stage] = {
        bytes,
        requests,
        depth: target.depth.get(stage) ?? 0,
        time: estimateDownloadTime(
          bytes,
          requests,
          stages.network,
          stages.config.concurrency ?? 4,
        ),
      };
    }
  }

  return {
    targets: [...targets.values()].map(target => target.plan),
    warnings,
    declarations,
    budget,
  };
};

/** Budget warnings of one target. */
export const checkBudgets = (
  plan: TargetPlan,
  stages: NormalizedResourceStages,
  entryInitialBytes: number,
  entryInitialRequests = 0,
): string[] => {
  const warnings: string[] = [];
  const label =
    plan.kind === 'entry' ? `entry "${plan.name}"` : `route "${plan.name}"`;
  const critical = getCriticalBudget(stages);
  for (const [stage, stats] of Object.entries(plan.stats)) {
    const configured = stages.config.budget?.[stage];
    const size =
      stage === 'critical' ? critical.size : parseSize(configured?.size);
    const requests =
      stage === 'critical' ? critical.requests : configured?.requests;
    if (size !== undefined && stats.bytes > size) {
      warnings.push(
        `${label}: stage "${stage}" downloads ${formatBytes(stats.bytes)}, over the budget of ${formatBytes(size)}.`,
      );
    }
    if (requests !== undefined && stats.requests > requests) {
      warnings.push(
        `${label}: stage "${stage}" makes ${stats.requests} requests, over the budget of ${requests}.`,
      );
    }
    if (configured?.depth !== undefined && stats.depth > configured.depth) {
      warnings.push(
        `${label}: stage "${stage}" loads chunks ${stats.depth} async levels deep, over the budget of ${configured.depth}.`,
      );
    }
  }
  const criticalStats = plan.stats.critical;
  if (criticalStats) {
    const time = estimateDownloadTime(
      criticalStats.bytes + entryInitialBytes,
      criticalStats.requests + entryInitialRequests,
      stages.network,
    );
    if (time > stages.firstPaintTarget) {
      warnings.push(
        `${label}: the entry files and "critical" take about ${time} ms to download on the target network, over the first paint target of ${stages.firstPaintTarget} ms.`,
      );
    }
  }
  return warnings;
};

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} kB`;
