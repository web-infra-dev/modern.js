import type {
  ResourcePreload,
  ResourcePreloadPlan,
  RoutePreloadPlan,
} from '@modern-js/utils/universal';
import type { ChunkId, ExternalStagePayload } from './types';

export type { ResourcePreload as PreloadItem };

/** Resource stages in routes-manifest.json, written by ResourceStagesPlugin. */
export interface ResourceStagesManifest extends ResourcePreloadPlan {
  version: 1;
  routes: Record<string, RouteStages>;
}

export interface RouteStages extends RoutePreloadPlan {
  /** Declared stage -> chunk ids. */
  s?: Record<string, ChunkId[]>;
  /** Route JS configured to load after critical. */
  rs?: Record<string, ChunkId[]>;
  /** Chunk id -> URLs of its CSS files. */
  k?: Record<string, string[]>;
  /** External payload of all declarations at runtime. */
  u?: ExternalStagePayload;
  /** External payload that also includes the route rule. */
  ur?: ExternalStagePayload;
}
