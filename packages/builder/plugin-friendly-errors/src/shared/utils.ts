import assert from 'assert';
import StackTracey from 'stacktracey';
import _ from '@modern-js/utils/lodash';
import { baseFormatter } from '../formatter/base';
import {
  ErrorFormatter,
  ErrorTransformer,
  ParsedError,
  ThrowableType,
  WithSourcesMixin,
} from './types';

export const parseError = (
  error: Error,
  type: ThrowableType = 'error',
  options?: WithSourcesMixin,
) => {
  const parsed = cloneErrorObject(error) as ParsedError;
  const cause = getErrorCause(error);
  parsed.trace = parseTrace(error, options);
  parsed.causes = [];
  if (cause) {
    const parsedCause = parseError(cause, type, options);
    parsed.causes.push(parsedCause, ...parsedCause.causes);
  }
  parsed.raw = error;
  parsed.type = type;

  return parsed;
};

export const cloneObject = <T>(error: T): T => {
  const cloned = Object.create(Object.getPrototypeOf(error));
  return _.merge(cloned, error);
};

export const cloneErrorObject = <T extends Error>(error: T): T => {
  const cloned = cloneObject(error);
  for (const k of Object.getOwnPropertyNames(error) as (keyof T)[]) {
    cloned[k] || (cloned[k] = error[k]);
  }
  return cloned;
};

export const transformError = (
  transformers: ErrorTransformer[],
  error: ParsedError,
): ParsedError => {
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

export const getErrorCause = (error: Error) => {
  const ret = error.cause || error.error;
  return ret instanceof Error ? ret : null;
};

export const getErrorCauses = (error: Error) => {
  const causes = [];
  while (true) {
    const e = getErrorCause(causes[causes.length - 1] || error);
    if (e) {
      causes.push(e);
    } else {
      break;
    }
  }
  return causes;
};

export const parseTrace = (error: Error, options?: WithSourcesMixin) => {
  if (options?.withSources) {
    return new StackTracey(error).withSources().items;
  } else {
    return new StackTracey(error).items;
  }
};
