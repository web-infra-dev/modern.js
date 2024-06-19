import {
  CookieAPI,
  HookContext,
  ModernRequest,
  ModernResponse,
} from '@modern-js/types';
import { getCookie } from 'hono/cookie';
import { getHost } from '../../utils';
import type { Context, HonoRequest, ServerEnv } from '../../types';

export type ResArgs = {
  status?: number;
  headers: Headers;
};

export function createBaseHookContext(
  c: Context<ServerEnv>,
  resParams?: ResArgs,
): HookContext {
  const logger = c.get('logger');
  const metrics = c.get('metrics');

  return {
    request: new BaseHookRequest(c),
    response: new BaseHookResponse(c, resParams),
    logger,
    metrics,
  };
}

class BaseHookRequest implements ModernRequest {
  #req: HonoRequest;

  #c: Context;

  #headersData: Record<string, string | undefined> = {};

  #headers: Record<string, string | undefined>;

  constructor(c: Context) {
    this.#c = c;
    this.#req = c.req;

    const rawHeaders = this.#req.raw.headers;

    rawHeaders.forEach((value, key) => {
      this.#headersData[key] = value;
    });

    this.#headers = new Proxy(this.#headersData, {
      get(target, p) {
        return target[p as string];
      },
      set(target, p, newValue) {
        target[p as string] = newValue;
        rawHeaders.set(p as string, newValue);
        return true;
      },
    });
  }

  get url(): string {
    // compat old middlwares,
    return this.#req.path;
  }

  // TODO: remove next major version
  set url(_u: string) {
    // ignore
  }

  get host(): string {
    return getHost(this.#req.raw);
  }

  // TODO: remove next major version
  set host(_h: string) {
    // ignore
  }

  get pathname(): string {
    return this.#req.path;
  }

  // TODO: remove next major version
  set pathname(_p: string) {
    // ignore
  }

  get query(): Record<string, any> {
    return this.#req.query();
  }

  // TODO: remove next major version
  set query(_q: Record<string, any>) {
    // ignore
  }

  get headers(): Record<string, any> {
    return this.#headers;
  }

  // TODO: remove next major version
  set headers(_h: Record<string, any>) {
    // ignore
  }

  get cookies(): Pick<CookieAPI, 'get'> {
    return {
      // FIXME: ModernRequest Type Error
      get: (key: string) => {
        return getCookie(this.#c, key) as string;
      },
    };
  }

  get cookie(): string {
    // FIXME: ModernRequest Type Error
    return this.#req.header('cookie') as string;
  }

  // TODO: remove next major version
  set cookie(_c: string) {
    // ignore
  }
}

class BaseHookResponse implements ModernResponse {
  /**
   * Just for compat afterRender Hook action before.
   *
   * Don't use this attribute.
   * */
  private_overrided: boolean = false;

  #c: Context;

  #resArgs?: ResArgs;

  constructor(c: Context, resArgs?: ResArgs) {
    this.#c = c;
    this.#resArgs = resArgs;
  }

  get(key: string) {
    return this.#c.res.headers.get(key) as
      | string
      | number
      | string[]
      | undefined;
  }

  set(key: string, value: string | number) {
    // we should append, if the key is `set-cookie`
    if (['set-cookie', 'Set-Cookie'].includes(key)) {
      this.#c.header(key, value.toString(), {
        append: true,
      });
      this.#resArgs?.headers.append(key, value.toString());
    } else {
      this.#c.header(key, value.toString());
      this.#resArgs?.headers.set(key, value.toString());
    }
  }

  status(code: number) {
    this.#c.status(code);
    this.#resArgs && (this.#resArgs.status = code);
  }

  get cookies() {
    const setCookie = (key: string, value: string) => {
      this.#c.header('set-cookie', `${key}=${value}`, {
        append: true,
      });
    };

    const clearCookie = () => {
      this.#c.header('set-cookie', undefined);
    };

    return {
      set: setCookie,
      clear: clearCookie,
    };
  }

  raw(
    body: string,
    options?:
      | {
          status?: number | undefined;
          headers?: Record<string, any> | undefined;
        }
      | undefined,
  ) {
    this.#c.res = this.#c.newResponse(body, options);
    this.private_overrided = true;
  }
}
