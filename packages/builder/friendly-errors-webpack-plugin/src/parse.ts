import { inspect } from 'util';
import { JSONValue } from '@modern-js/builder-shared';
import StackTracey from '../compiled/stacktracey';
import { baseFormatter } from './formatter';
import {
  ErrorFormatter,
  ErrorTransformer,
  ThrowableType,
  TracingFrame,
} from './shared/types';
import { cloneInstance, getErrorCause } from './shared/utils';

export type Serializable<T> = {
  [K in keyof T]: T[K] extends JSONValue ? T[K] : never;
};

export interface ParseOptions {
  withSources?: boolean;
  type?: ThrowableType;
}

export class ParsedError<E extends Error = Error> {
  type: ThrowableType = 'error';

  cause?: ParsedError;

  trace: TracingFrame[] = [];

  parent?: ParsedError;

  name: string;

  message: string;

  readonly raw: E;

  constructor(error: E, options: ParseOptions = {}) {
    this.raw = error;
    this.name = this.raw.name ?? 'Error';
    this.message = this.raw.message ?? '';
    this.type = options.type ?? this.type;

    if (options.withSources) {
      this.trace = new StackTracey(error).withSources().items;
    } else {
      this.trace = new StackTracey(error).items;
    }

    const rawCause = getErrorCause(this.raw);
    if (rawCause) {
      this.cause = new ParsedError(rawCause);
      this.cause.parent = this;
    }
  }

  transform(...transformers: ErrorTransformer[]): this {
    let ret = cloneInstance(this);
    for (const transformer of transformers) {
      ret = (transformer(ret) as this) ?? ret;
    }
    if (this.cause) {
      this.cause = this.cause.transform(...transformers);
    }
    return ret;
  }

  inspect(...formatters: ErrorFormatter[]) {
    let formatted = '';
    for (const formatter of formatters) {
      formatted = formatter(this) ?? formatted;
      if (formatted) {
        break;
      }
    }
    return formatted || baseFormatter(this);
  }

  get causes(): ParsedError[] {
    const ret: ParsedError[] = [];
    if (this.cause?.causes.length) {
      ret.push(...this.cause.causes);
    }
    return ret;
  }

  [inspect.custom]() {
    return this.inspect(baseFormatter);
  }

  freeze(...formatters: ErrorFormatter[]): Readonly<this> {
    const formatted = this.inspect(...formatters);
    const ret = {
      ...this,
      [inspect.custom]: () => formatted,
    };
    return Object.freeze(ret);
  }
}
