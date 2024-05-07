import { RequestPayload } from '@modern-js/types';
import { LoaderContext } from './createLoaderCtx';

interface Get<P extends Record<string, unknown>> {
  <Key extends keyof P>(key: Key): P[Key];
  <T>(key: LoaderContext<T>): T;
}

interface Set<P extends Record<string, unknown>> {
  <Key extends keyof P>(key: Key, value: P[Key]): void;
  <T>(key: LoaderContext<T>, value: T): void;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type RequestContext<P extends Record<string, unknown> = {}> = {
  get: Get<P & RequestPayload>;
  set: Set<P & RequestPayload>;
};

export function createRequestContext<P extends Record<string, unknown>>(
  context?: Map<string | symbol, unknown>,
): RequestContext<P> {
  const _context = context || new Map();

  function get(key: string): unknown;
  function get<T>(key: LoaderContext<T>): T;
  function get<T>(key: string | LoaderContext<T>): T | unknown {
    if (typeof key === 'string') {
      return _context.get(key);
    } else {
      return _context.get(key.symbol) || key.getDefaultValue();
    }
  }

  function set(key: string, value: unknown): void;
  function set<T>(key: LoaderContext<T>, value: T): void;
  function set<T>(key: string | LoaderContext<T>, value: T | unknown): void {
    if (typeof key === 'string') {
      _context.set(key, value);
    } else {
      _context.set(key.symbol, value);
    }
  }

  return {
    set,
    get,
  };
}
