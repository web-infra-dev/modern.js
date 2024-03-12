import type { IncomingMessage } from 'node:http';
import type { Logger, Reporter } from '@modern-js/types';
import type { ServerManifest } from './server';

export interface RenderOptions {
  logger: Logger;
  /** ssr render html templates */
  templates: Record<string, string>;
  serverManifest: ServerManifest;
  reporter?: Reporter;
  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;
