import type { IncomingMessage } from 'node:http';
import type { Logger, Reporter } from '@modern-js/types';
import type { ServerManifest } from './server';

export interface RenderOptions {
  logger: Logger;

  /** ssr render html templates */
  templates: Record<string, string>;

  /** Communicating with custom server hook & modern ssr runtime. */
  locals?: Record<string, any>;
  serverManifest: ServerManifest;
  reporter?: Reporter;
  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
