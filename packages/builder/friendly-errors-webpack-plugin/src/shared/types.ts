import StackTracey from '../../compiled/stacktracey';

export type TracingFrame = StackTracey.Entry;

export interface ParsedError<R extends Error = Error> extends Error {
  type: ThrowableType;
  raw: R;
  causes: ParsedError[];
  trace: TracingFrame[];
  isCause: boolean;
  details?: unknown;
}

export interface WithSourcesMixin {
  withSources?: boolean;
}

export interface IsCauseMixin {
  isCause?: boolean;
}

export type ErrorTransformer = (error: ParsedError) => ParsedError | void;

export type ErrorFormatter = (error: ParsedError) => string | void;

export type ThrowableType = 'error' | 'warning';
