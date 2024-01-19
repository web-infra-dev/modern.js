import type { IncomingMessage, ServerResponse } from 'http';
import {
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
} from '@modern-js/types';
import { HonoContext, HonoNodeEnv } from '../types';
import { createBaseHookContext } from './hook/base';
import { RouterAPI } from './hook/routerApi';
import { TemplateApi } from './hook/template';

export function createAfterMatchCtx(
  c: HonoContext,
  entryName: string,
): AfterMatchContext {
  const baseContext = createBaseHookContext(c);

  return {
    ...baseContext,
    router: new RouterAPI(entryName),
  };
}

export function createAfterRenderCtx(c: HonoContext): AfterRenderContext {
  const baseContext = createBaseHookContext(c);

  return {
    ...baseContext,
    template: new TemplateApi(c),
  };
}

export function createCustomMiddlewaresCtx(
  c: HonoContext<HonoNodeEnv>,
): MiddlewareContext {
  const baseContext = createBaseHookContext(c);

  return {
    ...baseContext,
    reporter: undefined,
    // TODO: handle the locals
    response: {
      ...baseContext.response,
      locals: {},
    },
    source: {
      req: c.env.node?.req as IncomingMessage,
      res: c.env.node?.res as ServerResponse,
    },
  };
}
