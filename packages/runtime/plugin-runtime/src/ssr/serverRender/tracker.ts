import type { BaseSSRServerContext } from '@modern-js/types';

export type SSRTracker = ReturnType<typeof createSSRTracker>;

export enum SSRTimings {
  SSR_RENDER_TOTAL,
  SSR_PREFETCH,
  SSR_RENDER_HTML,
  SSR_RENDER_SHELL,
}

export enum SSRErrors {
  PREFETCH,
  RENDER_HTML,
  RENDER_STREAM,
  RENDER_SHELL,
}

const errors: Record<
  SSRErrors,
  {
    reporter?: string;
    metrics?: string;
    logger?: string;
  }
> = {
  [SSRErrors.PREFETCH]: {
    reporter: 'SSR Error - App Prefetch Render',
    logger: 'App Prefetch Render',
    metrics: 'app.prefetch.render.error',
  },
  [SSRErrors.RENDER_HTML]: {
    reporter: 'SSR Error - App Render To HTML',
    logger: 'App Render To HTML',
    metrics: 'app.render.html.error',
  },
  [SSRErrors.RENDER_STREAM]: {
    reporter: 'SSR Error - App Render To Streaming',
    logger: 'An error occurs during streaming SSR',
    metrics: 'app.render.streaming.error',
  },
  [SSRErrors.RENDER_SHELL]: {
    metrics: 'app.render.streaming.shell.error',
  },
};

const timings: Record<
  SSRTimings,
  {
    reporter?: string;
    serverTiming?: string;
    metrics?: string;
    logger?: string;
  }
> = {
  [SSRTimings.SSR_PREFETCH]: {
    reporter: 'ssr-prefetch',
    serverTiming: 'ssr-prefetch',
    metrics: 'app.prefeth.cost',
    logger: 'App Prefetch cost = %d ms',
  },
  [SSRTimings.SSR_RENDER_HTML]: {
    reporter: 'ssr-render-html',
    serverTiming: 'ssr-render-html',
    metrics: 'app.render.html.cost',
    logger: 'App Render To HTML cost = %d ms',
  },
  [SSRTimings.SSR_RENDER_TOTAL]: {
    reporter: 'ssr-render-total',
    serverTiming: 'ssr-render-total',
    metrics: 'app.render.cost',
    logger: 'App Render Total cost = %d ms',
  },
  [SSRTimings.SSR_RENDER_SHELL]: {
    reporter: 'ssr-render-shell',
  },
};

export function createSSRTracker({
  reporter,
  serverTiming,
  metrics,
  logger,
}: BaseSSRServerContext) {
  const tracker = {
    get sessionId() {
      return reporter.sessionId;
    },
    trackError(key: SSRErrors, e: Error) {
      const {
        reporter: reporterContent,
        metrics: metricsContent,
        logger: loggerContent,
      } = errors[key];

      reporterContent && reporter.reportError(reporterContent, e);
      metricsContent && metrics.emitCounter(metricsContent, 1);
      loggerContent && logger.error(loggerContent, e);
    },
    trackTiming(key: SSRTimings, cost: number) {
      const {
        reporter: reporterName,
        serverTiming: serverTimingName,
        logger: loggerName,
        metrics: metricsName,
      } = timings[key];

      reporterName && reporter.reportTiming(reporterName, cost);
      serverTimingName && serverTiming.addServeTiming(serverTimingName, cost);
      metricsName && metrics.emitTimer(metricsName, cost);
      loggerName && logger.debug(loggerName, cost);
    },
  };
  return tracker;
}
