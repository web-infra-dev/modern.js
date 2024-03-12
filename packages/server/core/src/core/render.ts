import { IncomingMessage } from 'node:http';
import { Logger, Reporter } from '@modern-js/types';

export interface RenderOptions {
  logger: Logger;
  /** ssr render html templates */
  tpls: Record<string, string>;
  serverManifest: ServerManifest;
  reporter?: Reporter;
  nodeReq?: IncomingMessage;
}

export type Render = (
  request: Request,
  options: RenderOptions,
) => Promise<Response>;

export type ServerManifest = {
  jsBundles?: Record<string, Record<string, any>>;
  loadableStats?: Record<string, any>;
  routeManifest?: Record<string, any>;
};
