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
    logger?: string;
  }
> = {
  [SSRErrors.PRERENDER]: {
    reporter: 'App Prerender',
    logger: 'App Prerender',
  },
  [SSRErrors.USE_LOADER]: {
    reporter: 'App run useLoader',
    logger: 'App run useLoader',
  },
  [SSRErrors.RENDER_HTML]: {
    reporter: 'App Render To HTML',
    logger: 'App Render To HTML',
  },
  [SSRErrors.RENDER_STREAM]: {
    reporter: 'App Render To Streaming',
    logger: 'An error occurs during streaming SSR',
  },
  [SSRErrors.RENDER_SHELL]: {
    // metrics: 'app.render.streaming.shell.error',
  },
};

const timings: Record<
  SSRTimings,
  {
    reporter?: string;
    serverTiming?: string;
    logger?: string;
  }
> = {
  [SSRTimings.PRERENDER]: {
    reporter: 'ssr-prerender',
    serverTiming: 'ssr-prerender',
    logger: 'App Prerender cost = %d ms',
  },
  [SSRTimings.RENDER_HTML]: {
    reporter: 'ssr-render-html',
    serverTiming: 'ssr-render-html',
    logger: 'App Render To HTML cost = %d ms',
  },
  [SSRTimings.RENDER_SHELL]: {
    reporter: 'ssr-render-shell',
    logger: 'App Render To Shell cost = %d ms',
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
  logger,
}: BaseSSRServerContext) {
  const tracker = {
    get sessionId() {
      return reporter.sessionId;
    },
    trackError(key: SSRErrors, e: Error) {
      const { reporter: reporterContent, logger: loggerContent } = errors[key];

      // unit add `SSR Error - `prefix
      reporterContent &&
        reporter.reportError(`SSR Error - ${reporterContent}`, e);
      loggerContent && logger.error(loggerContent, e);
    },
    trackTiming(key: SSRTimings, cost: number) {
      const {
        reporter: reporterName,
        serverTiming: serverTimingName,
        logger: loggerName,
      } = timings[key];

      reporterName && reporter.reportTiming(reporterName, cost);
      serverTimingName && serverTiming.addServeTiming(serverTimingName, cost);
      loggerName && logger.debug(loggerName, cost);
    },
  };
  return tracker;
}
