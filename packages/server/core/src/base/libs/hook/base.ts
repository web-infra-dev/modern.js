import {
  CookieAPI,
  HookContext,
  Metrics,
  ModernRequest,
  ModernResponse,
} from '@modern-js/types';
import { getCookie } from 'hono/cookie';
import { HonoContext, HonoRequest, Logger } from '../../types';
import { getHost } from '../utils';

export function createBaseHookContext(
  c: HonoContext,
  logger: Logger,
  metrics?: Metrics,
): HookContext {
  return {
    request: new BaseHookRequest(c),
    response: new BaseHookResponse(c),
    logger,
    metrics,
  };
}

class BaseHookRequest implements ModernRequest {
  private req: HonoRequest;

  private c: HonoContext;

  constructor(c: HonoContext) {
    this.c = c;
    this.req = c.req;
  }

  get url(): string {
    return this.req.url;
  }

  get host(): string {
    return getHost(this.req.raw);
  }

  get pathname(): string {
    return this.req.path;
  }

  get query(): Record<string, any> {
    return this.req.query();
  }

  get headers(): Record<string, any> {
    return this.req.header();
  }

  get cookies(): Pick<CookieAPI, 'get'> {
    return {
      // FIXME: ModernRequest Type Error
      get: (key: string) => {
        return getCookie(this.c, key) as string;
      },
    };
  }

  get cookie(): string {
    // FIXME: ModernRequest Type Error
    return this.req.header('cookie') as string;
  }
}

class BaseHookResponse implements ModernResponse {
  /**
   * Just for compat afterRender Hook action before.
   *
   * Don't use this attribute.
   * */
  private_overrided: boolean = false;

  private c: HonoContext;

  constructor(c: HonoContext) {
    this.c = c;
  }

  get(key: string) {
    return this.c.res.headers.get(key) as
      | string
      | number
      | string[]
      | undefined;
  }

  set(key: string, value: string | number) {
    // we should append, if the key is `set-cookie`
    if (['set-cookie', 'Set-Cookie'].includes(key)) {
      this.c.header(key, value.toString(), {
        append: true,
      });
    } else {
      this.c.header(key, value.toString());
    }
  }

  status(code: number) {
    this.c.status(code);
  }

  get cookies() {
    const setCookie = (key: string, value: string) => {
      this.c.header('set-cookie', `${key}=${value}`, {
        append: true,
      });
    };

    const clearCookie = () => {
      this.c.header('set-cookie', undefined);
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
    this.c.res = this.c.newResponse(body, options);
    this.private_overrided = true;
  }
}
