import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http';
import { URL } from 'url';
import qs from 'querystring';
import { Metrics, Logger } from './utils';

export interface ModernServerContext {
  req: IncomingMessage;

  res: ServerResponse;

  params: Record<string, string>;

  logger: Logger;

  metrics?: Metrics;

  setParams: (params: Record<string, string>) => void;

  getReqHeader: (key: string) => void;

  headers: IncomingHttpHeaders;

  method: string;

  url: string;

  host: string;

  protocol: string;

  origin: string;

  href: string;

  parsedURL: URL;

  path: string;

  querystring: string;

  query: qs.ParsedUrlQuery;

  status: number;

  resHasHandled: () => boolean;
}

export type BaseSSRServerContext = {
  request: {
    params: Record<string, string>;
    pathname: string;
    query: Record<string, string>;
    headers: IncomingHttpHeaders;
    host: string;
    cookieMap: Record<string, any>;
    [propsName: string]: any;
  };
  response: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => void;
  };
  redirection: { url?: string; status?: number };
  distDir: string;
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
  loadableManifest?: string;
  cacheConfig?: any;
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
