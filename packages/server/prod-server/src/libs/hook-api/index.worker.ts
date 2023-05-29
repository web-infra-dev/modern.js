import {
  AfterMatchContext,
  AfterRenderContext,
  HookContext,
  Logger,
  Metrics,
  MiddlewareContext,
} from '@modern-js/types/server';
import { BaseRequest, BaseResponse, ServerResponseLike } from './base';
import { RouteAPI } from './route';
import { TemplateAPI } from './template';

export interface WorkerResponse {
  headers: Headers;
  status: number;
  isSent: boolean;
  locals?: Record<string, any>;
  body?: string;
}

export interface WorkerServerContext {
  res: WorkerResponse;
  req: Request;
  logger: Logger;
  metrics: Metrics;
}

class ServerResponse implements ServerResponseLike {
  locals?: Record<string, any>;

  private res: WorkerResponse;

  constructor(res: WorkerResponse) {
    this.res = res;
    this.locals = res.locals;
  }

  set statusCode(code: number) {
    this.res.status = code;
  }

  get statusCode(): number {
    return this.res.status;
  }

  getHeader(key: string) {
    return this.res.headers.get(key) ?? undefined;
  }

  setHeader(key: string, value: any) {
    this.res.headers.set(key, value);
  }

  removeHeader(key: string) {
    this.res.headers.delete(key);
  }

  end(body: string) {
    this.res.body = body;
    this.res.isSent = true;
  }
}

export const base = (context: WorkerServerContext): HookContext => {
  const { req, res, logger, metrics } = context;
  const serverResponse = new ServerResponse(res);

  // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
  const { host, pathname, searchParams } = new URL(req.url);

  const headers = {} as Record<string, any>;
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    response: new BaseResponse(serverResponse),
    request: new BaseRequest({
      url: req.url,
      host,
      path: pathname,
      headers,
      // eslint-disable-next-line node/no-unsupported-features/es-builtins
      query: Object.fromEntries(searchParams),
    }),
    logger,
    metrics,
  };
};

export const createAfterMatchContext = (
  context: WorkerServerContext,
  entryName: string,
): AfterMatchContext => {
  const baseContext = base(context);
  return {
    ...baseContext,
    router: new RouteAPI(entryName),
  };
};

export const createAfterRenderContext = (
  context: WorkerServerContext,
  content: string,
): AfterRenderContext => {
  const baseContext = base(context);
  return {
    ...baseContext,
    template: new TemplateAPI(content),
  };
};

export const createMiddlewareContext = (
  context: WorkerServerContext,
): MiddlewareContext<'worker'> => {
  const baseContext = base(context);
  (baseContext.response as any).locals = context.res.locals;

  const { url, headers } = context.req;

  const rawRequest = new Request(url, {
    headers,
  });

  return {
    ...baseContext,
    response: baseContext.response as any,
    source: {
      req: rawRequest,
      res: baseContext.response,
    },
  };
};
