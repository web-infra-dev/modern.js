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

export interface ReportEventPayload {
  name: string;

  // metrics is some speficy value
  metrics?: Record<string, number>;

  categories?: Record<string, string>;
}

export interface ReportLogPayload {
  content: string;

  extra?: Record<string, string | number>;

  level?: 'debug' | 'info' | 'warn' | 'error';
}

export type Reporter = {
  sessionId?: string;
  userId?: string;

  reportLog: (payload: ReportLogPayload) => void;
  reportEvent: (payload: ReportEventPayload) => void;
  reportError: (content: string, type: string, e: Error) => void;
  reportTime: (name: string, type: string, cost: number) => void;
  reportInfo: (content: string, type: string) => void;
  reportWarn: (content: string, type: string) => void;
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
