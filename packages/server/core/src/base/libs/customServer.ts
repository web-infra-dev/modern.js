import type { IncomingMessage, ServerResponse } from 'http';
import {
  AfterMatchContext,
  AfterRenderContext,
  Metrics,
  MiddlewareContext,
  Logger,
  AfterStreamingRenderContext,
  ServerRoute,
} from '@modern-js/types';
import { MaybeAsync } from '@modern-js/plugin';
import { HonoContext, HonoNodeEnv } from '../types';
import { createBaseHookContext } from './hook/base';
import { RouterAPI } from './hook/routerApi';
import { TemplateApi } from './hook/template';

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

  return {
    ...baseContext,
    reporter: undefined,
    // TODO: handle the locals
    // TODO: need to confirm
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

// eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/text-decoder
const decoder: TextDecoder = new TextDecoder();

// eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/text-encoder
const encoder: TextEncoder = new TextEncoder();

export function afterRenderInjectStream(
  fn: (content: string) => MaybeAsync<string>,
) {
  return new TransformStream({
    async transform(chunk, controller) {
      const content = decoder.decode(chunk);

      const newContent = await fn(content);

      controller.enqueue(encoder.encode(newContent));
    },
  });
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
