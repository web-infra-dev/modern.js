import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import StackTracey from '../../compiled/stacktracey';
import { prettyFormatter, baseFormatter } from '../formatter';
import {
  transformModuleParseError,
  transformReduceCauses,
  flattenErrorCauses,
  transformCleanMessage,
} from '../transformer';
import {
  ErrorFormatter,
  ErrorTransformer,
  IsCauseMixin,
  ParsedError,
  ThrowableType,
  WithSourcesMixin,
} from './types';

export const builtinTransformers = [
  transformReduceCauses,
  transformCleanMessage,
  flattenErrorCauses,
  transformModuleParseError,
] as const;

export const parseError = (
  error: Error,
  type: ThrowableType = 'error',
  options: WithSourcesMixin & IsCauseMixin = {},
) => {
  const parsed = cloneErrorObject(error) as ParsedError;
  const cause = getErrorCause(error);
  parsed.trace = parseTrace(error, options);
  parsed.causes = [];
  if (cause) {
    const parsedCause = parseError(cause, type, { ...options, isCause: true });
    parsed.causes.push(parsedCause, ...parsedCause.causes);
  }
  parsed.isCause = options.isCause ?? false;
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
  assert(typeof error === 'object', 'Error must be an object');
  const err = error as any;
  const causes = [err.cause, err.error, err.originalError];
  return causes.find(cause => cause instanceof Error);
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

export interface OutputPrettyErrorOptions {
  withSources?: boolean;
  output?: (msg: string, type: ThrowableType) => any;
  formatters?: boolean | ErrorFormatter[];
  transformers?: boolean | ErrorTransformer[];
  cwd?: boolean | string;
  type?: ThrowableType;
}

export interface OutputPrettyErrorContext
  extends Required<OutputPrettyErrorOptions> {
  formatters: ErrorFormatter[];
  transformers: ErrorTransformer[];
}

const outputFormattedError: OutputPrettyErrorOptions['output'] = (
  msg,
  type,
) => {
  if (type === 'error') {
    console.error(msg);
  } else if (type === 'warning') {
    console.warn(msg);
  }
};

const createOutputPrettyErrorContext = (
  options: OutputPrettyErrorOptions = {},
): OutputPrettyErrorContext => {
  const cwd = options.cwd || process.cwd();
  const output = options.output || outputFormattedError;
  const formatters: ErrorFormatter[] = [];
  if (Array.isArray(options.formatters)) {
    formatters.push(...options.formatters);
  }
  if (options.formatters !== false) {
    formatters.push(prettyFormatter);
  }
  const transformers: ErrorTransformer[] = [];
  if (Array.isArray(options.transformers)) {
    transformers.push(...options.transformers);
  }
  if (options.transformers !== false) {
    transformers.push(...builtinTransformers);
  }
  const type: ThrowableType = options.type || 'error';
  return {
    cwd,
    output,
    formatters,
    transformers,
    withSources: options.withSources ?? true,
    type,
  };
};

export const outputPrettyError = (
  error: Error,
  options: OutputPrettyErrorOptions = {},
) => {
  const ctx = createOutputPrettyErrorContext(options);
  const parsed = parseError(error, ctx.type, ctx);
  const transformed = transformError(ctx.transformers, parsed);
  const formatted = formatError(ctx.formatters, transformed);
  ctx.output(formatted, ctx.type);
};
