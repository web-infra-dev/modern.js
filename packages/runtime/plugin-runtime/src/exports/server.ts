import type {
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
  NextFunction,
} from '@modern-js/types';

export type {
  // cache
  Container,
  CacheControl,
  CacheOptionProvider,
  CacheOption,
  // middleware
  UnstableMiddlewareContext,
  UnstableMiddleware,
  UnstableNext,
  // monitors
  MonitorEvent,
  Monitors,
  CoreMonitor,
  LogEvent,
  LogLevel,
  TimingEvent,
} from '@modern-js/types';

export const hook = (
  attacher: ({
    addMiddleware,
    afterMatch,
    afterRender,
  }: {
    addMiddleware: (mid: Middleware) => void;
    afterRender: (hook: AfterRenderHook) => void;
    afterMatch: (hook: AfterMatchHook) => void;
  }) => void,
) => attacher;

export type AfterRenderHook = (
  context: AfterRenderContext,
  next: NextFunction,
) => void;

export type AfterMatchHook = (
  context: AfterMatchContext,
  next: NextFunction,
) => void;

export type Middleware = (
  context: MiddlewareContext,
  next: NextFunction,
) => Promise<void> | void;
