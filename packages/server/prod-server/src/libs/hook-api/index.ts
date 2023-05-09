import type {
  ModernServerContext,
  MiddlewareContext,
  AfterMatchContext,
  AfterRenderContext,
  HookContext,
} from '@modern-js/types';
import { BaseRequest, BaseResponse } from './base';
import { RouteAPI } from './route';
import { TemplateAPI } from './template';

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

const base = (context: ModernServerContext): HookContext => {
  const { res } = context;

  return {
    response: new BaseResponse(res),
    request: new BaseRequest(context),
    logger: context.logger,
    metrics: context.metrics,
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
