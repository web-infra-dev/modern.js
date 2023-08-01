import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http';
import qs from 'querystring';
import type { SSRMode } from 'common';
import { Metrics, Logger, Reporter, ServerTiming } from './utils';

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

export type BaseSSRServerContext = {
  request: {
    params: Record<string, string>;
    pathname: string;
    query: Record<string, string>;
    headers: IncomingHttpHeaders;
    host: string;
    body?: string;
    [propsName: string]: any;
  };
  response: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => void;
    locals: Record<string, any>;
  };
  redirection: { url?: string; status?: number };
  loadableStats: Record<string, any>;
  routeManifest?: Record<string, any>;
  template: string;
  entryName: string;
  logger: {
    error: (message: string, e: Error | string) => void;
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
  };
  metrics: {
    emitTimer: (
      name: string,
      cost: number,
      tags: Record<string, unknown> = {},
    ) => void;
    emitCounter: (
      name: string,
      counter: number,
      tags: Record<string, unknown> = {},
    ) => void;
  };
  reporter: Reporter;
  serverTiming: ServerTiming;
  cacheConfig?: any;

  enableUnsafeCtx?: boolean;

  nonce?: string;

  req: ModernServerContext['req'];

  res: ModernServerContext['res'];

  mode?: SSRMode; // ssr type
};

export interface ISAppContext {
  appDirectory: string;
  distDirectory: string;
  sharedDirectory: string;
  plugins: {
    server?: any;
    serverPkg?: any;
  }[];
  [key: string]: unknown;
}
