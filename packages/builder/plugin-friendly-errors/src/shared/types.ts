import StackTracey from 'stacktracey';

export type TracingFrame = StackTracey.Entry;

export interface ParsedError<R extends Error = Error> extends Error {
  type: ThrowableType;
  raw: R;
  causes: ParsedError[];
  trace: TracingFrame[];
}

export interface WithSourcesMixin {
  withSources?: boolean;
}

export type ErrorTransformer = (error: ParsedError) => ParsedError | void;

export type ErrorFormatter = (error: ParsedError) => string | void;

export type ThrowableType = 'error' | 'warning';
