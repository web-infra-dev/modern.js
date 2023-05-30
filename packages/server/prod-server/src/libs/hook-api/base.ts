import {
  CookieAPI,
  Metrics,
  ModernRequest,
  ModernResponse,
  Logger,
} from '@modern-js/types/server';
import cookie from 'cookie';

export interface ServerResponseLike {
  statusCode?: number;
  locals?: Record<string, any>;
  getHeader: (key: string) => string | undefined | string[] | number;
  setHeader: (key: string, value: string | number | string[]) => this | void;
  removeHeader: (key: string) => void;
  end: (body: string) => this | void;
}
export class BaseResponse implements ModernResponse {
  public cookies: CookieAPI;

  private res: ServerResponseLike;

  constructor(res: ServerResponseLike) {
    this.res = res;

    this.cookies = {
      set: this.setCookie.bind(this),
      clear: this.clearCookie.bind(this),
    };
  }

  public get(key: string) {
    return this.res.getHeader(key);
  }

  public set(key: string, value: string | number) {
    return this.res.setHeader(key, value);
  }

  public status(code: number) {
    this.res.statusCode = code;
  }

  private setCookie(key: string, value: string, options?: any) {
    const cookieValue = String(this.res.getHeader('set-cookie') || '');
    const fmt = Array.isArray(cookieValue)
      ? cookieValue
      : [cookieValue].filter(Boolean);
    fmt.push(cookie.serialize(key, value, options));

    this.res.setHeader('set-cookie', fmt.length === 1 ? fmt[0] : fmt);
  }

  private clearCookie() {
    this.res.removeHeader('set-cookie');
  }

  public raw(
    body: string,
    options?: { status?: number; headers?: Record<string, any> },
  ) {
    const { status, headers = {} } = options || {};
    Object.entries(headers).forEach(([key, value]) => {
      this.res.setHeader(key, value);
    });
    if (status) {
      this.res.statusCode = status;
    }

    this.res.end(body);
  }
}

export interface ServerRequestLike {
  url: string;
  host: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
}

export class BaseRequest implements ModernRequest {
  public readonly url: string;

  public readonly host: string;

  public readonly pathname: string;

  public readonly query: Record<string, any>;

  public readonly headers: Record<string, any>;

  public readonly cookie: string;

  public cookies: Pick<CookieAPI, 'get'>;

  private _cookie: Record<string, string>;

  constructor(request: ServerRequestLike) {
    this.url = request.url;
    this.host = request.host;
    this.pathname = request.path;
    this.query = request.query;
    this.headers = request.headers;
    this.cookie = request.headers.cookie || '';

    this._cookie = cookie.parse(this.cookie);
    this.cookies = {
      get: this.getCookie.bind(this),
    };
  }

  private getCookie(key: string) {
    return this._cookie[key];
  }
}

export interface ServerContextLike {
  res: ServerResponseLike;
  req: any;

  metrics: Metrics;
  logger: Logger;

  url: string;
  host: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
}
