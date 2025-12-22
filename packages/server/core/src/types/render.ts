import type { IncomingMessage } from 'node:http';
import type {
  Logger,
  Metrics,
  Monitors,
  Reporter,
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types';
import type { NodeRequest } from '@modern-js/types/server';
import type { ServerManifest } from './server';

// TODO: combine some field with RequestHandlerOptions
export interface RenderOptions {
  monitors: Monitors;

  loaderContext?: Map<string, unknown>;

  /** ssr render html templates */
  templates: Record<string, string>;

  /** Communicating with custom server hook & modern ssr runtime. */
  locals?: Record<string, any>;
  /** @deprecated */
  reporter?: Reporter;

  /** For compat rewrite MPA, while not modify request  */
  matchPathname?: string;

  /** For compat rewrite MPA, while not modify request  */
  matchEntryName?: string;

  serverManifest: ServerManifest;

  rscServerManifest?: RscServerManifest;

  rscClientManifest?: RscClientManifest;

  rscSSRManifest?: RscSSRManifest;

  nodeReq?: NodeRequest;
  contextForceCSR?: string;

  bindings?: any;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
