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

  private _cookie: Record<string, string>;

  constructor(res: ServerResponse) {
    this.res = res;

    this._cookie = cookie.parse((res.getHeader('set-cookie') as string) || '');

    this.cookies = {
      get: this.getCookie.bind(this),
      set: this.setCookie.bind(this),
      delete: this.deleteCookie.bind(this),
      clear: this.clearCookie.bind(this),
      apply: this.applyCookie.bind(this),
    };
  }

  public get(key: string) {
    return this.res.getHeader(key);
  }

  public set(key: string, value: string) {
    return this.res.setHeader(key, value);
  }

  public status(code: number) {
    this.res.statusCode = code;
  }

  private getCookie(key: string) {
    return this._cookie[key];
  }

  private setCookie(key: string, value: string) {
    this._cookie[key] = value;
  }

  private deleteCookie(key: string) {
    if (this._cookie[key]) {
      delete this._cookie[key];
    }
  }

  private clearCookie() {
    this._cookie = {};
  }

  private applyCookie() {
    const str = Object.entries(this._cookie)
      .map(([key, value]) => {
        return cookie.serialize(key, value);
      })
      .join('; ');
    if (str) {
      this.res.setHeader('set-cookie', str);
    } else {
      this.res.removeHeader('set-cookie');
    }
  }

  public raw(
    body: string,
    { status, headers }: { status: number; headers: Record<string, any> },
  ) {
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
