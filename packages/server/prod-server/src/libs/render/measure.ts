import { BaseSSRServerContext, Logger, Metrics } from '@modern-js/types';

export const createMetrics = (
  context: BaseSSRServerContext,
  metrics: Metrics,
) => {
  const { entryName: entry, request } = context;
  const { pathname = '' } = request || {};

  const emitTimer = (
    name: string,
    cost: number,
    tags: Record<string, unknown> = {},
  ) => {
    metrics.emitTimer(name, cost, {
      ...tags,
      pathname,
      entry,
    });
  };

  const emitCounter = (
    name: string,
    counter: number,
    tags: Record<string, unknown> = {},
  ) => {
    metrics.emitCounter(name, counter, {
      ...tags,
      pathname,
      entry,
    });
  };

  return { emitTimer, emitCounter };
};

export const createLogger = (
  serverContext: BaseSSRServerContext,
  logger: Logger,
) => {
  const request = serverContext.request || {};
  const { headers = {}, pathname = '' } = request;

  const debug = (message: string, ...args: any[]) => {
    logger.debug(`SSR Debug - ${message}, req.url = %s`, ...args, pathname);
  };

  const info = (message: string, ...args: any[]) => {
    logger.info(`SSR Info - ${message}, req.url = %s`, ...args, pathname);
  };

  const error = (message: string, e: Error | string) => {
    logger.error(
      `SSR Error - ${message}, error = %s, req.url = %s, req.headers = %o`,
      e instanceof Error ? e.stack || e.message : e,
      pathname,
      headers,
    );
  };

  return {
    error,
    info,
    debug,
  };
};
