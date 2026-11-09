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
  /** Compressed bytes of all files. */
  size: number;
}

export interface EntryInfo {
  /** Chunks the entry loads with `<script>` / `<link>`. */
  initial: Set<ChunkId>;
  /** Every chunk reachable from the entry. */
  reachable: Set<ChunkId>;
  /** The server renders the entry, so it adds the route lists per request. */
  serverRendered: boolean;
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

export interface PreloadItem {
  h: string;
  a: 'script' | 'style';
  l?: 1;
}

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
  /** Preloads of `critical` declarations. */
  critical: PreloadItem[];
  /** Preloads of route JS by the route rule. */
  routeCritical: PreloadItem[];
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
}

const DEFAULT_CRITICAL_REQUESTS = 8;

/** Rank of a stage in download order; `critical` first. */
export const createStageRank = (order: string[]) => (stage: string) =>
  stage === 'critical'
    ? 0
    : order.indexOf(stage) + 1 || Number.MAX_SAFE_INTEGER;

const toPreloads = (chunk: ChunkInfo, low = false): PreloadItem[] => [
  ...chunk.js.map(h => ({
    h,
    a: 'script' as const,
    ...(low ? { l: 1 as const } : {}),
  })),
  ...chunk.css.map(h => ({
    h,
    a: 'style' as const,
    ...(low ? { l: 1 as const } : {}),
  })),
];

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
 *   the rest goes to `visible`.
 */
export const planResourceStages = (
  snapshot: Snapshot,
  stages: NormalizedResourceStages,
  options: { routeRule: boolean },
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
          routeCritical: [],
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

  const budget = getCriticalBudget(stages);
  if (options.routeRule) {
    const routeConfig = stages.config.routes || {};
    for (const [routeName, route] of snapshot.routes) {
      const override = routeConfig[routeName];
      if (override === false) {
        continue;
      }
      const entry = snapshot.entries.get(route.entry);
      const target = getTarget('route', routeName, route.entry);
      const entryTarget = targets.get(`entry:${route.entry}`);
      let bytes = 0;
      let requests = 0;
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
        let stage: string;
        if (override) {
          stage = override;
        } else if (route.own.has(chunkId)) {
          stage = 'critical';
        } else {
          const files = chunk.js.length + chunk.css.length;
          stage =
            bytes + chunk.size <= budget.size &&
            requests + files <= budget.requests
              ? 'critical'
              : 'visible';
        }
        if (stage === 'critical') {
          bytes += chunk.size;
          requests += chunk.js.length + chunk.css.length;
          target.plan.routeCritical.push(
            ...toPreloads(chunk, !route.own.has(chunkId)),
          );
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
        plan.critical.push(...toPreloads(chunk));
      } else {
        (plan.lists[stage] ??= []).push(chunkId);
        if (chunk.css.length) {
          css[String(chunkId)] = chunk.css;
        }
      }
      byStage.set(stage, [...(byStage.get(stage) ?? []), chunkId]);
    }
    for (const [stage, chunkIds] of Object.entries(plan.routeLists)) {
      for (const chunkId of chunkIds) {
        const files = snapshot.chunks.get(chunkId)?.css;
        if (files?.length) {
          css[String(chunkId)] = files;
        }
      }
      byStage.set(stage, [...(byStage.get(stage) ?? []), ...chunkIds]);
    }
    plan.css = css;

    const criticalFiles = [...plan.critical, ...plan.routeCritical];
    if (criticalFiles.length) {
      byStage.set('critical', byStage.get('critical') ?? []);
    }
    for (const [stage, chunkIds] of byStage) {
      const chunks = chunkIds
        .map(id => snapshot.chunks.get(id))
        .filter((chunk): chunk is ChunkInfo => Boolean(chunk));
      let bytes = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      let requests = chunks.reduce(
        (sum, chunk) => sum + chunk.js.length + chunk.css.length,
        0,
      );
      if (stage === 'critical' && plan.routeCritical.length) {
        const urls = new Set(plan.routeCritical.map(item => item.h));
        const routeChunks = [...snapshot.chunks.values()].filter(chunk =>
          [...chunk.js, ...chunk.css].some(file => urls.has(file)),
        );
        bytes += routeChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        requests += urls.size;
      }
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
  };
};

/** Budget warnings of one target. */
export const checkBudgets = (
  plan: TargetPlan,
  stages: NormalizedResourceStages,
  entryInitialBytes: number,
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
      criticalStats.requests,
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
