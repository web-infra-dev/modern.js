import { Next } from 'hono';
import { Logger, Reporter } from '@modern-js/types';
import { HonoContext, HonoNodeEnv } from '../types';

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

export function injectLogger(inputLogger: Logger) {
  return async (c: HonoContext<HonoNodeEnv>, next: Next) => {
    const logger = c.get('logger');
    if (!logger && inputLogger) {
      c.set('logger', inputLogger);
    }
    await next();
  };
}
