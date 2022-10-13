import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import qs from 'querystring';
import { Buffer } from 'buffer';
import type { ModernServerContext as ModernServerContextInterface } from '@modern-js/types';
import createEtag from 'etag';
import fresh from 'fresh';
import { headersWithoutCookie } from '../../utils';

export type ContextOptions = {
  etag?: boolean;
};

type ResponseBody = string | Buffer;

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

  get logger() {
    return this.req.logger;
  }

  get metrics() {
    return this.req.metrics;
  }

  public serverData: Record<string, any>;

  private options: Record<string, any> = {};

  constructor(
    req: IncomingMessage,
    res: ServerResponse,
    options?: ContextOptions,
  ) {
    this.req = req;
    this.res = res;
    this.options = options || {};
    this.serverData = {};

    this.bind();
  }

  private bind() {
    const { req, res } = this as any;
    req.get = (key: string) => this.getReqHeader(key);
    res.set = (key: string, value: any) => this.res.setHeader(key, value);
    res.send = (body: ResponseBody) => {
      this.send(body);
    };
  }

  // compat express res.send, only support etag now
  public send(body: ResponseBody) {
    try {
      const generateETag = !this.res.getHeader('ETag') && this.options.etag;
      if (body !== undefined && generateETag) {
        const encoding = typeof body === 'string' ? 'utf-8' : undefined;
        const buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;

        const etag = createEtag(buf, { weak: true });
        if (etag) {
          this.res.setHeader('ETag', etag);
        }
      }
      if (this.fresh) {
        this.status = 304;
      }
    } catch (e) {
      this.logger.error((e as Error).message);
    }

    this.res.end(body);
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

  public get fresh() {
    const { status, res, method } = this;

    // GET or HEAD for weak freshness validation only
    if ('GET' !== method && 'HEAD' !== method) {
      return false;
    }

    if ((status >= 200 && status < 300) || 304 === status) {
      return fresh(this.headers, {
        etag: res.getHeader('ETag'),
        'last-modified': res.getHeader('Last-Modified'),
      });
    }

    return false;
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
    // this should never happened
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

  public error(dig: string, e: Error | string = '') {
    this.logger.error(
      `Web Server Error - ${dig}, error = %s, req.url = %s, req.headers = %o`,
      e instanceof Error ? e.stack || e.message : e,
      this.path,
      headersWithoutCookie(this.headers),
    );
  }
}
