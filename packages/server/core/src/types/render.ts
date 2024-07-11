import type { IncomingMessage } from 'node:http';
import type { Logger, Metrics, Monitors, Reporter } from '@modern-js/types';
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

  monitors?: Monitors;

  serverManifest: ServerManifest;

  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
