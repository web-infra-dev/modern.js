import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http';
import { Reporter } from './utils';

export type CookieAPI = {
  /**
   * @deprecated Using set empty cookie instead.
   */
  delete?: (key: string) => void;
  get?: (key: string) => string;
  set: (key: string, value: string, options?: any) => void;
  clear: () => void;
};

export interface ModernResponse {
  get: (key: string) => string | number | string[] | undefined;
  set: (key: string, value: string | number) => void;
  status: (code: number) => void;
  cookies: CookieAPI;
  raw: (
    body: string,
    options?: { status?: number; headers?: Record<string, any> },
  ) => void;
}

export interface ModernRequest {
  url: string;
  host: string;
  pathname: string;
  query: Record<string, any>;
  cookie: string;
  cookies: Pick<CookieAPI, 'get'>;
  headers: IncomingHttpHeaders;
}

export type HookContext = {
  response: ModernResponse;
  request: ModernRequest;
  logger: Logger;
  reporter?: Reporter;
  metrics?: Metrics;
};

export type AfterMatchContext = HookContext & {
  router: {
    readonly current: string;
    readonly url: string;
    readonly status: number;
    redirect: (url: string, status?: number) => void;
    rewrite: (entry: string) => void;
    use: (entry: string) => void;
  };
};

export type AfterRenderContext = HookContext & {
  template: {
    set: (content: string) => void;
    get: () => string;
    prependHead: (fragment: string) => void;
    appendHead: (fragment: string) => void;
    prependBody: (fragment: string) => void;
    appendBody: (fragment: string) => void;
  };
};

export type MiddlewareContext<T extends 'worker' | 'node' = 'node'> =
  HookContext & {
    response: ModernResponse & { locals: Record<string, any> };
    source: {
      req: T extends 'worker' ? Request : IncomingMessage;
      res: T extends 'worker' ? ModernResponse : ServerResponse;
    };
  };
