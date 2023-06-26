import _ from '@modern-js/utils/lodash';
import { baseFormatter } from '../formatter';
import { ParsedError } from '../core/parse';
import { ErrorFormatter, ErrorTransformer } from './types';

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
  let formatted = '';
  for (const formatter of formatters) {
    formatted = formatter(error) ?? formatted;
    if (formatted) {
      break;
    }
  }
  return formatted ?? baseFormatter(error);
};
