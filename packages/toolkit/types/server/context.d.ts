import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http';
import { URL } from 'url';
import qs from 'querystring';
import { Measure, Logger } from './util';

export interface ModernServerContext {
  req: IncomingMessage;

  res: ServerResponse;

  params: Record<string, string>;

  logger: Logger;

  measure?: Measure;

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
