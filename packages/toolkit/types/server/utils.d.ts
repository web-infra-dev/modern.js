import { IncomingMessage, ServerResponse } from 'http';

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

export type NextFunction = () => void;

export type ProxyDetail = {
  target: string;
  pathRewrite?: Record<string, string>;
  secure?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  bypass?: (
    req: IncomingMessage,
    res: ServerResponse,
    proxyOptions: BffProxyOptions,
  ) => string | undefined | null | false;
  context?: string | string[];
  changeOrigin?: boolean;
};

export type BffProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;
