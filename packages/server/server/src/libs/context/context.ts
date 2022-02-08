import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import qs from 'querystring';
import type {
  ModernServerContext as ModernServerContextInterface,
  Metrics,
  Logger,
} from '@modern-js/types/server';
import { toMessage } from '../../utils';

export type ContextOptions = {
  logger?: Logger;
  metrics?: Metrics;
};

export class ModernServerContext implements ModernServerContextInterface {
  /**
   * http request
   */
  public req: IncomingMessage;

  /**
   * http response
   */
  public res: ServerResponse;

  /**
   * url params
   */
  public params: Record<string, string> = {};

  public logger: Logger;

  public metrics?: Metrics;

  public serverData: Record<string, any>;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.req = req;
    this.res = res;
    this.logger = req.logger;
    this.metrics = req.metrics;
    this.serverData = {};

    this.bind();
  }

  private bind() {
    const { req, res } = this as any;
    req.get = (key: string) => this.getReqHeader(key);
    res.set = (key: string, value: any) => this.res.setHeader(key, value);
  }

  public setParams(params: Record<string, string>) {
    this.params = params;
  }

  public setServerData(key: string, value: any) {
    this.serverData[key] = value;
  }

  public getReqHeader(key: string) {
    const { req } = this;
    const field = key.toLowerCase();
    switch (field) {
      case 'referer':
      case 'referrer':
        return req.headers.referrer || req.headers.referer || '';
      default:
        return req.headers[field] || '';
    }
  }

  /* request property */
  public get headers() {
    return this.req.headers;
  }

  public get method(): string {
    return this.req.method!;
  }

  public get url() {
    return this.req.url || '';
  }

  public set url(val) {
    this.req.url = val;
  }

  public get host() {
    let host = this.getReqHeader('X-Forwarded-Host');
    if (!host) {
      host = this.getReqHeader('Host');
    }
    return (host as string).split(/\s*,\s*/, 1)[0] || '';
  }

  public get protocol() {
    if ((this.req.socket as any).encrypted) {
      return 'https';
    }

    const proto = this.getReqHeader('X-Forwarded-Proto');
    return proto ? (proto as string).split(/\s*,\s*/, 1)[0] : 'http';
  }

  public get origin() {
    return `${this.protocol}://${this.host}`;
  }

  public get href() {
    return this.origin + this.url;
  }

  public get parsedURL() {
    const url = new URL(this.req.url!, this.origin);
    return url;
  }

  public get path() {
    return this.parsedURL.pathname;
  }

  public set path(p) {
    const url = new URL(this.req.url!, this.origin);
    // this should never happend
    if (!url || !p) {
      return;
    }

    if (url.pathname === p) {
      return;
    }

    url.pathname = p;

    this.url = url.toString();
  }

  public get querystring() {
    if (!this.req) {
      return '';
    }
    return this.parsedURL.search.replace(/^\?/, '') || '';
  }

  public get query() {
    const str = this.querystring;
    return qs.parse(str);
  }

  /* response property */
  public get status() {
    return this.res.statusCode;
  }

  public set status(statusCode) {
    this.res.statusCode = statusCode;
  }

  /**
   * 判断链接是否已经关闭
   */
  public resHasHandled(): boolean {
    return this.res.writableEnded;
  }

  public logInfo() {
    return {
      headers: this.headers,
      href: this.href,
      url: this.url,
    };
  }

  public error(dig: string, err: Error | string = '') {
    const message = toMessage(dig, err);
    const reqInfo = this.logInfo();

    this.logger.error(`${reqInfo.url} - ${message}`, reqInfo);
  }
}
