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
    cookie?: string;
    [propsName: string]: any;
  };
  redirection: { url?: string; status?: number };
  distDir: string;
  template: string;
  entryName: string;
  logger: Logger;
  metrics?: Metrics;
  loadableManifest?: string;
  cacheConfig?: any;
};
