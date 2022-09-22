import { ServerResponse } from 'http';
import { ModernServerContext } from '@modern-js/types';

type CookieAPI = {
  get: (key: string) => string;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  clear: () => void;
};

class Response {
  public cookies: CookieAPI;

  private res: ServerResponse;

  private _cookie: any;

  constructor(res: ServerResponse) {
    this.res = res;

    this._cookie = {};

    this.cookies = {
      get: this.getCookie,
      set: this.setCookie,
      delete: this.deleteCookie,
      clear: this.clearCookie,
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

  public getCookie(key: string) {
    return this._cookie.get(key);
  }

  public setCookie(key: string, value: string) {
    this._cookie.set(key, value);
    this.res.setHeader('cookie', this._cookie.stringify());
  }

  public deleteCookie(key: string) {
    this._cookie.delete(key);
    this.res.setHeader('cookie', this._cookie.stringify());
  }

  public clearCookie() {
    this.res.setHeader('cookie', '');
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

const base = (context: ModernServerContext) => {
  const { res, req } = context;

  return {
    response: new Response(res),
    // request: {
    //   host: string;
    //   pathname: string;
    //   query: Record<string, any>;
    //   cookie: string;
    //   cookies: {
    //     get: (key: string) => string;
    //   };
    //   headers: IncomingHttpHeaders;
    // };
    // logger?: Logger;
    // metrics?: Metrics;
  };
};

export const createAfterMatchContext = (context: ModernServerContext) => {
  const baseContext = base(context);
  return {
    ...baseContext,
    router: {
      // redirect: ?
    },
  };
};

export const createAfterRenderContext = () => {};
