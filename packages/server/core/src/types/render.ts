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
import type { ServerManifest } from './server';

export interface RenderOptions {
  loaderContext?: Map<string, unknown>;

  /** ssr render html templates */
  templates: Record<string, string>;

  /** Communicating with custom server hook & modern ssr runtime. */
  locals?: Record<string, any>;

  /** @deprecated  */
  logger: Logger;

  /** @deprecated */
  metrics?: Metrics;

  /** @deprecated */
  reporter?: Reporter;

  /** For compat rewrite MPA, while not modify request  */
  matchPathname?: string;

  /** For compat rewrite MPA, while not modify request  */
  matchEntryName?: string;

  monitors?: Monitors;

  serverManifest: ServerManifest;

  rscServerManifest?: RscServerManifest;

  rscClientManifest?: RscClientManifest;

  rscSSRManifest?: RscSSRManifest;

  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
