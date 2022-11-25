import { IncomingMessage, ServerResponse } from 'http';

export type CookieAPI = {
  get: (key: string) => string;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  clear: () => void;
  apply: () => void;
};

export interface ModernResponse {
  get: (key: string) => string | number | string[] | undefined;
  set: (key: string, value: string) => void;
  status: (code: number) => void;
  cookies: CookieAPI;
  raw: (
    body: string,
    { status, headers }: { status: number; headers: Record<string, any> },
  ) => void;
}

export interface ModernRequest {
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
  metrics?: Metrics;
};

export type AfterMatchContext = HookContext & {
  router: {
    readonly current: string;
    readonly url: string;
    readonly status: number;
    redirect: (url: string, status: number) => void;
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

export type MiddlewareContext = HookContext & {
  response: ModernResponse & { locals: Record<string, any> };
  source: {
    req: IncomingMessage;
    res: ServerResponse;
  };
};
