import { time } from '@modern-js/runtime-utils/time';
import type {
  CoreMonitor,
  CounterEvent,
  LogEvent,
  LogLevel,
  Logger,
  Monitors,
  TimingEvent,
} from '@modern-js/types';
import { SERVER_TIMING, ServerTimings } from '../constants';
import type {
  Context,
  MiddlewareHandler,
  Next,
  ServerEnv,
  ServerPlugin,
} from '../types';

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

    trace(message: string, ...args: any[]): void {
      log('trace', message, args);
    },

    timing(
      name: string,
      dur: number,
      desc?: string,
      tags?: Record<string, any>,
      ...args: any[]
    ) {
      const event: TimingEvent = {
        type: 'timing',
        payload: {
          name,
          dur,
          desc,
          tags,
          args,
        },
      };
      coreMonitors.forEach(monitor => monitor(event));
    },

    counter(name: string, tags?: Record<string, any>, ...args: any[]) {
      const event: CounterEvent = {
        type: 'counter',
        payload: {
          name,
          args,
          tags,
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
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();

      middlewares.push({
        name: 'init-monitor',
        handler: (async (c: Context<ServerEnv>, next) => {
          if (!c.get('monitors')) {
            const monitors = createMonitors();
            c.set('monitors', monitors);
          }

          return next();
        }) as MiddlewareHandler,

        order: 'pre',
      });
    });
  },
});

export const injectloggerPlugin = (inputLogger: Logger): ServerPlugin => ({
  name: '@modern-js/inject-logger',

  setup(api) {
    const logger = inputLogger;
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();

      middlewares.push({
        name: 'inject-logger',

        handler: (async (c: Context<ServerEnv>, next) => {
          const pathname = c.req.path;

          const loggerMonitor: CoreMonitor = event => {
            if (event.type === 'log') {
              const { level, message, args } = event.payload;

              if (level === 'trace') {
                logger.info(message, ...(args || []));
              } else {
                logger[level](message, ...(args || []));
              }
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
        }) as MiddlewareHandler,
      });
    });
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

    api.onPrepare(() => {
      const { middlewares, metaName } = api.getServerContext();

      middlewares.push({
        name: 'inject-server-timing',

        handler: (async (c: Context<ServerEnv>, next) => {
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
        }) as MiddlewareHandler,
      });
    });
  },
});

export function requestLatencyMiddleware() {
  return async (c: Context<ServerEnv>, next: Next) => {
    const monitors = c.get('monitors');

    if (!monitors) {
      await next();
      return;
    }

    // record page request timing, should include hook/middleware/render
    const getCost = time();

    await next();

    const cost = getCost();
    monitors.timing(ServerTimings.SERVER_HANDLE_REQUEST, cost);
  };
}
