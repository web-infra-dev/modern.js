import type { IncomingHttpHeaders, ServerResponse } from 'http';
import type {
  ModernServerContext,
  HookContext,
  AfterMatchContext,
  CookieAPI,
  AfterRenderContext,
  MiddlewareContext,
  ModernResponse,
  ModernRequest,
} from '@modern-js/types';
import cookie from 'cookie';
import { RouteAPI } from './route';
import { TemplateAPI } from './template';

class Response implements ModernResponse {
  public cookies: CookieAPI;

  private res: ServerResponse;

  constructor(res: ServerResponse) {
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
    const cookieValue = this.res.getHeader('set-cookie');
    const fmt = Array.isArray(cookieValue)
      ? cookieValue
      : ([cookieValue].filter(Boolean) as string[]);
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

class Request implements ModernRequest {
  public readonly url: string;

  public readonly host: string;

  public readonly pathname: string;

  public readonly query: Record<string, any>;

  public readonly headers: IncomingHttpHeaders;

  public readonly cookie: string;

  public cookies: Pick<CookieAPI, 'get'>;

  private _cookie: Record<string, string>;

  constructor(ctx: ModernServerContext) {
    this.url = ctx.url;
    this.host = ctx.host;
    this.pathname = ctx.path;
    this.query = ctx.query;
    this.headers = ctx.headers;
    this.cookie = ctx.headers.cookie || '';

    this._cookie = cookie.parse(this.cookie);
    this.cookies = {
      get: this.getCookie.bind(this),
    };
  }

  private getCookie(key: string) {
    return this._cookie[key];
  }
}

export const base = (context: ModernServerContext): HookContext => {
  const { res } = context;

  return {
    response: new Response(res),
    request: new Request(context),
    logger: context.logger,
    metrics: context.metrics,
  };
};

export const createAfterMatchContext = (
  context: ModernServerContext,
  entryName: string,
): AfterMatchContext => {
  const baseContext = base(context);
  return {
    ...baseContext,
    router: new RouteAPI(entryName),
  };
};

export const createAfterRenderContext = (
  context: ModernServerContext,
  content: string,
): AfterRenderContext => {
  const baseContext = base(context);
  return {
    ...baseContext,
    template: new TemplateAPI(content),
  };
};

export const createMiddlewareContext = (
  context: ModernServerContext,
): MiddlewareContext => {
  const baseContext = base(context);
  return {
    ...baseContext,
    response: {
      ...baseContext.response,
      locals: context.res.locals || {},
    },
    source: {
      req: context.req,
      res: context.res,
    },
  };
};
