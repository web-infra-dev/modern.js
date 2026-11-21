declare global {
  /**
   * Custom stages declared in `performance.resourceStages.stages`. The build
   * writes `modern-resource-stages.d.ts` that adds them here, so custom stage
   * names get completion and type checking on `stagedImport`.
   */
  // biome-ignore lint/suspicious/noEmptyInterface: augmented by generated types
  interface ModernResourceStages {}
}

export type ResourceStageRegistry = ModernResourceStages;

export type PageStage = 'critical' | 'visible' | 'interactive' | 'idle';

export type ElementStage = 'viewport' | 'interaction';

export type CustomStage = Extract<keyof ResourceStageRegistry, string>;

export type ResourceStage = PageStage | ElementStage | CustomStage;

export type ChunkId = string | number;

/** URL and earliest affected stage. Older builds store only the URL. */
export type ExternalStagePayload = string | [url: string, stage: string];

/**
 * Stage lists the build writes into the HTML (entry level) and the server adds
 * per request (matched routes). Field names are short because the payload is
 * inlined into every HTML response.
 */
export interface StagePayload {
  /** Runtime config, only in the entry level payload. */
  c?: RuntimeStageConfig;
  /** Stage name -> JS chunk ids to prefetch when the stage arrives. */
  s?: Record<string, ChunkId[]>;
  /**
   * Chunk id in `s` -> its CSS files, relative to the public path of the
   * bundler runtime (older builds wrote full URLs).
   */
  k?: Record<string, string[]>;
  /**
   * Client rendered entries only: lists of each route, picked after the router
   * matches. Server rendered pages get the lists of the matched routes from
   * the server instead.
   */
  r?: Record<
    string,
    { s?: Record<string, ChunkId[]>; k?: Record<string, string[]> }
  >;
  /** URL of a payload moved out of the HTML because it was too large. */
  u?: ExternalStagePayload;
  /** Entry level: chunk ids that have no JS file, e.g. CSS only chunks. */
  d?: ChunkId[];
  /**
   * Pushed by the framework runtime: a stage it detected, and when
   * (milliseconds since navigation start).
   */
  a?: [stage: string, time: number];
  /** Pushed by the framework runtime: ids of the matched routes. */
  q?: string[];
  /** Bundle that pushed `a` or `q`; payloads of another bundle are ignored. */
  b?: string;
}

export interface RuntimeStageConfig {
  /** Scheduled stages in the order they are downloaded. */
  o: string[];
  /** Bundle the lists were built for. */
  b?: string;
  /** Stages the application marks itself. */
  m?: string[];
  /** Stage -> milliseconds after its previous stage before it is marked anyway. */
  t?: Record<string, number>;
  /** Prefetches in flight at the same time. */
  n?: number;
  /** `output.crossOriginLoading`. */
  x?: 'anonymous' | 'use-credentials';
  /** Quiet window in milliseconds before `idle`. */
  i?: number;
}

export interface ResourceStageRecord {
  chunkId: ChunkId;
  /** Stage that prefetched the chunk; `undefined` when it was never declared. */
  stage?: string;
  /** Milliseconds since navigation start. */
  prefetchStart?: number;
  prefetchEnd?: number;
  /** When the application asked for the chunk (`import()`). */
  requested?: number;
  /** When the chunk finished loading for the application. */
  loaded?: number;
}

export interface ResourceStageReport {
  /** Stage -> milliseconds since navigation start when it arrived. */
  stages: Record<string, number>;
  records: ResourceStageRecord[];
  /**
   * Stages that were not prefetched: `saveData` or a 2G connection, or the
   * browser does not support `<link rel="prefetch">`.
   */
  skipped: string[];
}
