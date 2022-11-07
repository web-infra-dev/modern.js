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
  parsed.trace = flattenErrorTrace(error, options);
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

export const getErrorCauses = (error: Error) => {
  const causes = [];
  let e: unknown = error;
  while (e instanceof Error) {
    causes.push(e);
    e = e.cause || e.error;
  }
  return causes;
};

export const compressCauses = (
  causes: Error[],
  options?: WithSourcesMixin,
): StackTracey.Entry[] => {
  const parseTrace = options?.withSources
    ? (e: Error) => new StackTracey(e).withSources().items
    : (e: Error) => new StackTracey(e).items;
  const parsedTraces = causes.map(parseTrace);
  const compressed = _(parsedTraces).flatten().uniqBy('beforeParse').value();
  return compressed;
};

export const flattenErrorTrace = (error: Error, options?: WithSourcesMixin) => {
  const causes = getErrorCauses(error);
  const compressed = compressCauses(causes, options);
  return compressed;
};
