import type {
  ModernServerContext,
  HookContext,
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
  ServerRoute,
  AfterStreamingRenderContext,
} from '@modern-js/types';
import { RouteAPI } from './route';
import { TemplateAPI } from './template';
import { BaseRequest, BaseResponse } from './base';

export const base = (context: ModernServerContext): HookContext => {
  const { res } = context;

  return {
    response: new BaseResponse(res),
    request: new BaseRequest(context),
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
  route: Partial<ServerRoute>,
  content: string,
): AfterRenderContext => {
  const baseContext = base(context);

  return {
    ...baseContext,
    route,
    template: new TemplateAPI(content),
  };
};

export const createAfterStreamingRenderContext = (
  context: ModernServerContext,
  route: Partial<ServerRoute>,
): ((chunk: string) => AfterStreamingRenderContext) => {
  const baseContext = base(context);
  return (chunk: string) => {
    return {
      ...baseContext,
      route,
      chunk,
    };
  };
};

export const createMiddlewareContext = (
  context: ModernServerContext,
): MiddlewareContext => {
  const baseContext = base(context);
  (baseContext.response as any).locals = context.res.locals || {};
  return {
    ...baseContext,
    response: baseContext.response as any,
    reporter: context.reporter,
    source: {
      req: context.req,
      res: context.res,
    },
  };
};
