import assert from 'assert';
import { WebpackError } from 'webpack';
import StackTracey from 'stacktracey';
import { baseFormatter } from '../formatter/base';
import { ErrorFormatter, ErrorTransformer, ParsedError } from './types';

const _traceSerializeCache = new WeakMap<WebpackError, ParsedError>();

export const parseError = (error: WebpackError) => {
  if (_traceSerializeCache.has(error)) {
    return _traceSerializeCache.get(error)!;
  }

  const parsed = cloneObject(error) as ParsedError;
  parsed.trace = new StackTracey(error).items;
  parsed.raw = error;

  _traceSerializeCache.set(error, parsed);

  return parsed;
};

export const cloneObject = <T>(error: T): T => {
  const cloned = Object.create(Object.getPrototypeOf(error));
  Object.assign(cloned, error);
  return cloned;
};

export const transformError = (
  transformers: ErrorTransformer[],
  error: ParsedError,
): WebpackError => {
  return transformers.reduce(
    (error, transformer) => transformer(error) || error,
    error,
  );
};

export const formatError = (
  formatters: ErrorFormatter[] = [baseFormatter],
  error: ParsedError,
) => {
  let formatted: string | void;
  for (const formatter of formatters) {
    formatted = formatter(error);
    if (formatted) {
      break;
    }
  }
  assert(typeof formatted === 'string', 'No error formatter found');
  return formatted;
};
