import type { IncomingMessage, ServerResponse } from 'http';
import type {
  Options as ProxyOptions,
  Filter as ProxyFilter,
} from 'http-proxy-middleware';

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

export type Reporter<C = any> = {
  sessionId?: string;
  userId?: string;
  client?: C;

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
  context?: ProxyFilter;
};

export type BffProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;

export type CacheControlRange = 'header' | 'query';
export type CacheControl = {
  /**
   * The maxAge like http cache-control: max-age.
   *
   * It refers to the cache validation time, measured in (ms).
   */
  maxAge: number;

  /**
   * The staleWhileRevalidate reference to http header cache-control: stale-while-revalidate.
   *
   * It means that the cache is stale but can still be used directly while asynchronously revalidating it, measured in (ms).
   */
  staleWhileRevalidate: number;
  controlRanges?: CacheControlRange[];

  /**
    Users can specify CacheID in server hook or custom server middleware.

    Then CacheID would be as a part of cache symbol to cache SSR render result.
  */
  customKey?: string;

  cacheHandler?: (key: string) => void;
};
export type CacheOptionProvider = (req: IncomingMessage) => CacheControl;
export type CacheOption =
  | false
  | CacheOptionProvider
  | CacheControl
  | Record<string, CacheControl | CacheOptionProvider>;

export interface Container<K = string, V = string> {
  /**
   * Returns a specified element from the containter. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Containter.
   * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
   */
  get: (key: K) => V | undefined;

  /**
   * Adds a new element with a specified key and value to the storage. If an element with the same key already exists, the element will be updated.
   */
  set: (key: K, value: V) => this;

  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has: (key: K) => boolean;

  /**
   * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
   */
  delete: (key: K) => boolean;

  forEach?: (callbackFn: (v: V, k: K, containter: this) => void) => void;
}
