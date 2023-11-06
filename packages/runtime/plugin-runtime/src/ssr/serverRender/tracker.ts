import type { BaseSSRServerContext } from '@modern-js/types';

export type SSRTracker = ReturnType<typeof createSSRTracker>;

export enum SSRTimings {
  PRERENDER,
  RENDER_HTML,
  RENDER_SHELL,
  USE_LOADER,
}

export enum SSRErrors {
  PRERENDER,
  USE_LOADER,
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
  [SSRErrors.PRERENDER]: {
    reporter: 'SSR Error - App Prerender',
    logger: 'App Prerender',
    metrics: 'app.prerender.error',
  },
  [SSRErrors.USE_LOADER]: {
    reporter: 'SSR Error - App run useLoader',
    logger: 'App run useLoader',
    metrics: 'app.useloader.error',
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
  [SSRTimings.PRERENDER]: {
    reporter: 'ssr-prerender',
    serverTiming: 'ssr-prerender',
    metrics: 'app.prerender.cost',
    logger: 'App Prerender cost = %d ms',
  },
  [SSRTimings.RENDER_HTML]: {
    reporter: 'ssr-render-html',
    serverTiming: 'ssr-render-html',
    metrics: 'app.render.html.cost',
    logger: 'App Render To HTML cost = %d ms',
  },
  [SSRTimings.RENDER_SHELL]: {
    reporter: 'ssr-render-shell',
  },
  [SSRTimings.USE_LOADER]: {
    reporter: 'use-loader',
    serverTiming: 'use-loader',
    logger: 'App run useLoader cost = %d ms',
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
