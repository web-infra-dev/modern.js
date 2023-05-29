import type {
  ModernServerContext,
  HookContext,
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
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
  (baseContext.response as any).locals = context.res.locals || {};
  return {
    ...baseContext,
    response: baseContext.response as any,
    source: {
      req: context.req,
      res: context.res,
    },
  };
};
