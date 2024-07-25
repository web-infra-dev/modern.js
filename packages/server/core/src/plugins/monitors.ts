import type {
  Monitors,
  CoreMonitor,
  LogLevel,
  LogEvent,
  TimingEvent,
  Logger,
} from '@modern-js/types';
import { time } from '@modern-js/runtime-utils/time';
import { SERVER_TIMING, ServerTimings } from '../constants';
import type { Context, Next, ServerEnv, ServerPlugin } from '../types';

function createMonitors(): Monitors {
  const coreMonitors: CoreMonitor[] = [];

  const log = (level: LogLevel, message: string, args: any[]) => {
    const event: LogEvent = {
      type: 'log',
      payload: {
        level,
        message,
        args,
      },
    };

    coreMonitors.forEach(monitor => monitor(event));
  };

  const mointors: Monitors = {
    push(monitor: CoreMonitor) {
      coreMonitors.push(monitor);
    },

    error(message: string, ...args: any[]): void {
      log('error', message, args);
    },

    warn(message: string, ...args: any[]): void {
      log('warn', message, args);
    },

    debug(message: string, ...args: any[]): void {
      log('debug', message, args);
    },

    info(message: string, ...args: any[]): void {
      log('info', message, args);
    },

    timing(name: string, dur: number, desc?: string) {
      const event: TimingEvent = {
        type: 'timing',
        payload: {
          name,
          dur,
          desc,
        },
      };
      coreMonitors.forEach(monitor => monitor(event));
    },
  };

  return mointors;
}

export const initMonitorsPlugin = (): ServerPlugin => ({
  name: '@modern-js/init-mointor',

  setup(api) {
    return {
      prepare() {
        const { middlewares } = api.useAppContext();

        middlewares.push({
          name: 'init-monitor',
          handler: async (c: Context<ServerEnv>, next) => {
            if (!c.get('monitors')) {
              const monitors = createMonitors();
              c.set('monitors', monitors);
            }

            return next();
          },

          order: 'pre',
        });
      },
    };
  },
});

export const injectloggerPluigin = (inputLogger?: Logger): ServerPlugin => ({
  name: '@modern-js/inject-logger',

  setup(api) {
    const logger: Logger = inputLogger || console;

    return {
      prepare() {
        const { middlewares } = api.useAppContext();

        middlewares.push({
          name: 'inject-logger',

          handler: async (c: Context<ServerEnv>, next) => {
            if (!c.get('logger')) {
              c.set('logger', logger);
            }

            const pathname = c.req.path;

            const loggerMonitor: CoreMonitor = event => {
              if (event.type === 'log') {
                const { level, message, args } = event.payload;

                logger[level](message, ...(args || []));
              }

              if (event.type === 'timing') {
                const { name, dur, desc } = event.payload;

                if (desc) {
                  logger.debug(
                    `%s Debug - ${name}, cost: %s, req.url = %s `,
                    desc,
                    dur,
                    pathname,
                  );
                } else {
                  logger.debug(
                    `Debug - ${name}, cost: %s, req.url = %s`,
                    dur,
                    pathname,
                  );
                }
              }
            };

            const monitors = c.get('monitors');

            monitors?.push(loggerMonitor);

            return next();
          },
        });
      },
    };
  },
});

export const injectServerTiming = (): ServerPlugin => ({
  name: '@modern-js/inject-server-timing',

  setup(api) {
    interface ServerTiming {
      name: string;
      dur: number;
      desc?: string;
    }

    return {
      prepare() {
        const { middlewares, metaName } = api.useAppContext();

        middlewares.push({
          name: 'inject-server-timing',

          handler: async (c: Context<ServerEnv>, next) => {
            const serverTimings: ServerTiming[] = [];

            const timingMonitor: CoreMonitor = event => {
              if (event.type === 'timing') {
                serverTimings.push(event.payload);
              }
            };

            const monitors = c.get('monitors');

            monitors?.push(timingMonitor);

            await next();

            serverTimings.forEach(serverTiming => {
              const { name, desc, dur } = serverTiming;

              // TODO: Modern.js should't export anything about bytedance.

              const _name = `bd-${metaName}-${name}`;

              const value = `${_name};${
                desc ? `decs="${desc}";` : ''
              } dur=${dur}`;

              c.header(SERVER_TIMING, value, {
                append: true,
              });
            });
          },
        });
      },
    };
  },
});

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
    reporter.reportTiming(ServerTimings.SERVER_HANDLE_REQUEST, cost);
  };
}
