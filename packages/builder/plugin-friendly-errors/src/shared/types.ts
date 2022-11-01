import StackTracey from 'stacktracey';
import type * as webpack from 'webpack';

export type TracingFrame = StackTracey.Entry;

export interface ParsedError extends webpack.WebpackError {
  raw: webpack.WebpackError;
  trace: TracingFrame[];
}

export type ErrorTransformer = (error: ParsedError) => ParsedError | void;

export type ErrorFormatter = (error: ParsedError) => string | void;
