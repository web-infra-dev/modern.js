import type { Next } from 'hono';
import { Logger, Reporter } from '@modern-js/types';
import { time } from '@modern-js/runtime-utils/time';
import { ServerReportTimings } from '../constants';
import type { HonoContext } from '../../core/server';
import type { HonoNodeEnv } from '../adapters/node';

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
  return async (c: HonoContext<HonoNodeEnv>, next: Next) => {
    const reporter = c.get('reporter');
    if (!reporter) {
      c.set('reporter', defaultReporter);
    }
    await next();
  };
}

export function initReporter(entryName: string) {
  return async (c: HonoContext<HonoNodeEnv>, next: Next) => {
    const reporter = c.get('reporter');

    await reporter?.init({ entryName });

    // reporter global timeing
    const getCost = time();

    await next();

    const cost = getCost();
    reporter?.reportTiming(ServerReportTimings.SERVER_HANDLE_REQUEST, cost);
  };
}

export function injectLogger(inputLogger: Logger) {
  return async (c: HonoContext<HonoNodeEnv>, next: Next) => {
    const logger = c.get('logger');
    if (!logger && inputLogger) {
      c.set('logger', inputLogger);
    }
    await next();
  };
}
