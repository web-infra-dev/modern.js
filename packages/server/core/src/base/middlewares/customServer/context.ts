import {
  AfterMatchContext,
  AfterRenderContext,
  Metrics,
  MiddlewareContext,
  Logger,
  AfterStreamingRenderContext,
  ServerRoute,
} from '@modern-js/types';
import { HonoContext } from '../../../core/server';
import type { HonoNodeEnv } from '../../adapters/node';
import { getReporter } from '../monitor';
import { RouterAPI } from './routerApi';
import { TemplateApi } from './template';
import { createBaseHookContext } from './base';

export function createAfterMatchCtx(
  c: HonoContext,
  entryName: string,
  logger: Logger,
  metrics?: Metrics,
): AfterMatchContext {
  const baseContext = createBaseHookContext(c, logger, metrics);

  return {
    ...baseContext,
    router: new RouterAPI(entryName),
  };
}

export async function createAfterRenderCtx(
  c: HonoContext,
  logger: Logger,
  metrics?: Metrics,
): Promise<AfterRenderContext> {
  const baseContext = createBaseHookContext(c, logger, metrics);
  const resBody = await c.res.text();
  return {
    ...baseContext,
    template: new TemplateApi(resBody),
  };
}

export function createCustomMiddlewaresCtx(
  c: HonoContext<HonoNodeEnv>,
  logger: Logger,
  metrics?: Metrics,
): MiddlewareContext {
  const baseContext = createBaseHookContext(c, logger, metrics);

  const reporter = getReporter(c);

  return {
    ...baseContext,
    reporter,
    response: {
      ...baseContext.response,
      locals: {},
    },
    source: {
      req: c.env.node?.req,
      res: c.env.node?.res,
    },
  };
}

export function createAfterStreamingRenderContext(
  c: HonoContext,
  logger: Logger,
  route: Partial<ServerRoute>,
  metrics?: Metrics,
): (chunk: string) => AfterStreamingRenderContext {
  const baseContext = createBaseHookContext(c, logger, metrics);
  return (chunk: string) => {
    return {
      ...baseContext,
      route,
      chunk,
    };
  };
}
