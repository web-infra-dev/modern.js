import type { IncomingMessage, ServerResponse } from 'http';
import type { Options as ProxyOptions } from 'http-proxy-middleware';

export type Metrics = {
  emitCounter: (name: string, value: number, tags: Record<string, any>) => void;
  emitTimer: (name: string, value: number, tags: Record<string, any>) => void;
  gauges: () => void;
};

type LoggerFunction = (
  message?: number | string | Error,
  ...args: any[]
) => void;
export type Logger = {
  error: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  debug: LoggerFunction;
  log: LoggerFunction;
};

export interface ServerTiming {
  addServeTiming: (name: string, dur: number, decs?: string) => this;
}

export type Reporter = {
  sessionId?: string;
  userId?: string;
  client?: any;

  init: (payload: { match: any }) => void | Promise<void>;

  reportError: (
    content: string,
    e: Error,
    extra?: Record<string, string | number>,
  ) => void;

  reportTiming: (
    name: string,
    value: number,
    extra?: Record<string, string>,
  ) => void;

  reportInfo: (
    content: string,
    extra?: Record<string, string | number>,
  ) => void;

  reportWarn: (
    content: string,
    extra?: Record<string, string | number>,
  ) => void;
};

export type NextFunction = () => void;

export type ProxyDetail = ProxyOptions & {
  bypass?: (
    req: IncomingMessage,
    res: ServerResponse,
    proxyOptions: BffProxyOptions,
  ) => string | undefined | null | false;
  context?: string | string[];
};

export type BffProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;
