import { Logger, Metrics, Reporter } from '@modern-js/types';
import { time } from '@modern-js/runtime-utils/time';
import { Context, Next, ServerEnv, ServerPlugin } from '../types';
import { ServerReportTimings } from '../constants';

export interface MonitorOptions {
  logger?: Logger;
  metrics?: Metrics;
  reporter?: Reporter;
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

export function initReporter(entryName: string) {
  return async (c: Context<ServerEnv>, next: Next) => {
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

export const monitorPlugin = (options: MonitorOptions): ServerPlugin => ({
  name: '@modern-js/plugin-monitor',

  setup(api) {
    return {
      prepare() {
        const { middlewares } = api.useAppContext();

        middlewares.push({
          name: 'monitor',
          handler: async (c: Context<ServerEnv>, next: Next) => {
            const logger = c.get('logger');
            if (!logger && options.logger) {
              c.set('logger', options.logger);
            }

            const metrics = c.get('metrics');
            if (!metrics && options.metrics) {
              c.set('metrics', metrics);
            }

            const reporter = c.get('reporter');
            if (!reporter) {
              c.set('reporter', reporter || defaultReporter);
            }

            await next();
          },
        });
      },
    };
  },
});
