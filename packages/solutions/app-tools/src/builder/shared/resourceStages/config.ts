export type BuiltinPageStage = 'critical' | 'visible' | 'interactive' | 'idle';

export type ElementStage = 'viewport' | 'interaction';

export interface StageBudget {
  /** Compressed (gzip) bytes, e.g. `600kB` or `614400`. */
  size?: string | number;
  /** Number of files. */
  requests?: number;
  /** Async levels from the entry to a declared chunk. */
  depth?: number;
}

export interface CustomStageConfig {
  /** The stage this one comes after. Required for custom stages. */
  after?: string;
  /**
   * Milliseconds after the previous stage arrives before the stage is marked
   * anyway. Required for custom stages.
   */
  timeout?: number;
  /** Built-in stages only: the application marks the stage itself. */
  manual?: boolean;
}

export interface ResourceStagesUserConfig {
  /**
   * Custom stages, and built-in stages the application marks itself
   * (`{ interactive: { manual: true } }`).
   */
  stages?: Record<string, CustomStageConfig>;
  /**
   * Upper limits per stage. Exceeding one is a build warning. `critical`
   * defaults to what Fast 4G downloads in a third of the 1.8 s first paint
   * target.
   */
  budget?: Record<string, StageBudget>;
  /**
   * Route JS of streaming SSR pages. `true` preloads the JS of the matched
   * routes with a low priority within the `critical` budget, the rest at
   * `visible`; an object does the same and sets the stage of some routes by
   * route id (`false` leaves a route out). Off by default.
   */
  streamingRoutePreload?: boolean | Record<string, BuiltinPageStage | false>;
  /**
   * Source files in `node_modules` are not scanned for declarations, except
   * the packages matched here.
   */
  include?: (string | RegExp)[];
}

export const PAGE_STAGES: BuiltinPageStage[] = [
  'critical',
  'visible',
  'interactive',
  'idle',
];

export const ELEMENT_STAGES: ElementStage[] = ['viewport', 'interaction'];

/** Network the download times are estimated on: Chrome DevTools "Fast 4G". */
const NETWORK = { downlink: 9, rtt: 60 };
/** Milliseconds of first paint the `critical` budget is checked against. */
const FIRST_PAINT_TARGET = 1800;
/** Compressed bytes above which a stage list is written to a separate file. */
const INLINE_LIMIT = 2 * 1024;

export const parseSize = (value: string | number | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  const match = /^\s*([\d.]+)\s*(b|kb|kib|mb|mib)?\s*$/i.exec(value);
  if (!match) {
    throw new Error(`Invalid size "${value}" in performance.resourceStages`);
  }
  const unit = (match[2] ?? 'b').toLowerCase();
  const factor = unit.startsWith('m')
    ? 1024 * 1024
    : unit.startsWith('k')
      ? 1024
      : 1;
  return Math.round(Number(match[1]) * factor);
};

export interface NormalizedResourceStages {
  /** Scheduled stages in download order, `critical` and element stages excluded. */
  order: string[];
  /** Every stage name a declaration may use. */
  known: Set<string>;
  manual: string[];
  timeouts: Record<string, number>;
  network: { downlink: number; rtt: number };
  firstPaintTarget: number;
  inlineLimit: number;
  config: ResourceStagesUserConfig;
}

/**
 * Validate the config and work out the download order: a custom stage goes
 * right after the stage named in `after`; several after the same stage keep
 * their config order.
 */
export const normalizeResourceStages = (
  config: ResourceStagesUserConfig = {},
): NormalizedResourceStages => {
  const order = ['visible', 'interactive', 'idle'];
  const manual: string[] = [];
  const timeouts: Record<string, number> = {};
  const custom = Object.entries(config.stages ?? {});

  for (const [name, stage] of custom) {
    const builtin = (PAGE_STAGES as string[]).includes(name);
    if (name === 'critical' || (ELEMENT_STAGES as string[]).includes(name)) {
      throw new Error(
        `performance.resourceStages.stages.${name}: "${name}" cannot be configured.`,
      );
    }
    if (builtin) {
      if (stage.after) {
        throw new Error(
          `performance.resourceStages.stages.${name}: built-in stages keep their order, remove "after".`,
        );
      }
    } else if (!stage.after || stage.timeout === undefined) {
      throw new Error(
        `performance.resourceStages.stages.${name}: custom stages need "after" and "timeout".`,
      );
    }
    if (stage.manual || !builtin) {
      manual.push(name);
    }
    if (stage.timeout !== undefined) {
      timeouts[name] = stage.timeout;
    }
  }

  const pending = custom.filter(
    ([name]) => !(PAGE_STAGES as string[]).includes(name),
  );
  // Insert in passes so a custom stage can come after another custom stage.
  while (pending.length) {
    const before = pending.length;
    for (let i = 0; i < pending.length; i++) {
      const [name, stage] = pending[i];
      const after = stage.after!;
      const index = after === 'critical' ? -1 : order.indexOf(after);
      if (after !== 'critical' && index === -1) {
        continue;
      }
      let insertAt = index + 1;
      // keep config order among stages after the same one
      while (
        insertAt < order.length &&
        config.stages?.[order[insertAt]]?.after === after
      ) {
        insertAt++;
      }
      order.splice(insertAt, 0, name);
      pending.splice(i, 1);
      i--;
    }
    if (pending.length === before) {
      throw new Error(
        `performance.resourceStages.stages: "after" of ${pending
          .map(([name]) => name)
          .join(', ')} does not name a known stage.`,
      );
    }
  }

  return {
    order,
    known: new Set([...PAGE_STAGES, ...ELEMENT_STAGES, ...order]),
    manual,
    timeouts,
    network: NETWORK,
    firstPaintTarget: FIRST_PAINT_TARGET,
    inlineLimit: INLINE_LIMIT,
    config,
  };
};

/** Milliseconds to download `bytes` over `requests` requests on the network. */
export const estimateDownloadTime = (
  bytes: number,
  requests: number,
  network: { downlink: number; rtt: number },
  concurrency = 6,
) =>
  Math.round(
    (bytes * 8) / (network.downlink * 1000) +
      Math.ceil(requests / concurrency) * network.rtt,
  );
