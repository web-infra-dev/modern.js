import {
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
  AfterStreamingRenderContext,
  ServerRoute,
  HookContext,
} from '@modern-js/types';
import { HonoContext, ServerEnv } from '../../../core/server';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import { RouterAPI } from './routerApi';
import { TemplateApi } from './template';
import { createBaseHookContext } from './base';

export function getAfterMatchCtx(
  entryName: string,
  baseHookCtx: HookContext,
): AfterMatchContext {
  const afterMatchCtx = baseHookCtx as unknown as AfterMatchContext;

  afterMatchCtx.router = new RouterAPI(entryName);

  return afterMatchCtx;
}

export async function getAfterRenderCtx(
  c: HonoContext,
  baseHookCtx: HookContext,
  route: Partial<ServerRoute>,
): Promise<AfterRenderContext> {
  const afterRenderCtx = baseHookCtx as unknown as AfterRenderContext;

  const resBody = await c.res.text();
  afterRenderCtx.template = new TemplateApi(resBody);
  afterRenderCtx.route = route;

  return afterRenderCtx;
}

export function createCustomMiddlewaresCtx(
  c: HonoContext<ServerNodeEnv & ServerEnv>,
  locals: Record<string, any>,
): MiddlewareContext {
  const baseContext = createBaseHookContext(
    c as unknown as HonoContext<ServerEnv>,
  );

  const reporter = c.get('reporter');

  return {
    ...baseContext,
    reporter,
    response: {
      ...baseContext.response,
      locals,
    },
    source: {
      req: c.env.node?.req,
      res: c.env.node?.res,
    },
  };
}

export function createAfterStreamingRenderContext(
  baseHookCtx: HookContext,
  route: Partial<ServerRoute>,
): (chunk: string) => AfterStreamingRenderContext {
  return (chunk: string) => {
    return {
      ...baseHookCtx,
      route,
      chunk,
    };
  };
}
