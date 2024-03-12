import type { Logger, Metrics, Reporter } from '@modern-js/types';
import { time } from '@modern-js/runtime-utils/time';
import { ServerReportTimings } from '../constants';
import type { HonoContext, Next } from '../../core/server';

declare module 'hono' {
  interface ContextVariableMap {
    logger: Logger;
    reporter: Reporter;
    metrics?: Metrics;
  }
}

const defaultReporter: Reporter = {
  init() {
    // noImpl
  },
  reportError() {
    // noImpl
  },
  reportTiming() {
    // noImpl
  },
  reportInfo() {
    // noImpl
  },
  reportWarn() {
    // noImpl
  },
};

// TODO: unify
export function injectReporter() {
  return async (c: HonoContext, next: Next) => {
    const reporter = c.get('reporter');
    if (!reporter) {
      c.set('reporter', defaultReporter);
    }
    await next();
  };
}

export function getReporter(c: HonoContext) {
  const reporter = c.get('reporter');

  if (!reporter) {
    console.warn(
      'Reporter is not initialzed! Please inject reporter by using InjectReporter middleware',
    );
  }

  return reporter;
}

export function initReporter(entryName: string) {
  return async (c: HonoContext, next: Next) => {
    const reporter = c.get('reporter');

    if (!reporter) {
      await next();
      return;
    }

    await reporter.init({ entryName });

    // reporter global timeing
    const getCost = time();

    await next();

    const cost = getCost();
    reporter.reportTiming(ServerReportTimings.SERVER_HANDLE_REQUEST, cost);
  };
}

export function injectLogger(inputLogger: Logger) {
  return async (c: HonoContext, next: Next) => {
    const logger = c.get('logger');
    if (!logger && inputLogger) {
      c.set('logger', inputLogger);
    }
    await next();
  };
}

export function getLogger(c: HonoContext) {
  const logger = c.get('logger');

  if (!logger) {
    console.warn(
      'Logger is not initialzed! Please inject logger by using injectLogger Middleware',
    );
  }

  return logger;
}

export function injectMetrics(inputMetrics: Metrics) {
  return async (c: HonoContext, next: Next) => {
    const metrics = c.get('metrics');

    if (!metrics) {
      c.set('metrics', inputMetrics);
    }

    await next();
  };
}

export function getMetrics(c: HonoContext) {
  return c.get('metrics');
}
