import type {
  Server as HttpServer,
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from 'http';
import type qs from 'querystring';
import type { SSRMode } from 'common';
import type { Logger, Metrics, Reporter, ServerTiming } from './utils';

export interface RequestPayload {
  [key: string]: unknown;
}

export interface ModernServerContext {
  req: IncomingMessage;

  res: ServerResponse & { locals?: Record<string, any> };

  params: Record<string, string>;

  logger: Logger;

  metrics: Metrics;

  reporter: Reporter;

  serverTiming: ServerTiming;

  setParams: (params: Record<string, string>) => void;

  getReqHeader: (key: string) => void;

  headers: IncomingHttpHeaders;

  method: string;

  url: string;

  host: string;

  protocol: string;

  origin: string;

  href: string;

  path: string;

  querystring: string;

  query: qs.ParsedUrlQuery;

  status: number;

  serverData: Record<string, any>;

  resHasHandled: () => boolean;

  error: (dig: string, e: Error | string = '') => void;

  setServerData: (key: string, value: any) => void;
}

export interface BaseResponseLike {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => void;
  locals: Record<string, any>;
}

export type BaseSSRServerContext<T extends 'node' | 'worker' = 'node'> = {
  baseUrl: string;
  request: {
    params: Record<string, string>;
    pathname: string;
    query: Record<string, string>;
    headers: IncomingHttpHeaders;
    host: string;
    url: string;
    referer?: string;
    userAgent?: string;
    cookie?: string;
    cookieMap?: Record<string, string>;
    bindings?: any;
  };
  response: BaseResponseLike;
  loadableStats: Record<string, any>;
  routeManifest?: Record<string, any>;
  template: string;
  entryName: string;
  loaderContext: Map<string, unknown>;
  logger: Logger;
  serverTiming: ServerTiming;
  reporter?: Reporter;
  metrics?: Metrics;
  nonce?: string;
  /** SSR type  */
  mode?: SSRMode;
};

export interface ServerInitHookContext {
  app?: HttpServer;
}
