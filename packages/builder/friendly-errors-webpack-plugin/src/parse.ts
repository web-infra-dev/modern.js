import { inspect } from 'util';
import { JSONValue } from '@modern-js/builder-shared';
import _ from '@modern-js/utils/compiled/lodash';
import type { Chunk, Compiler, Module, StatsModuleTraceItem } from 'webpack';
import StackTracey from '../compiled/stacktracey';
import { baseFormatter } from './formatter';
import type {
  ErrorFormatter,
  ErrorTransformer,
  ThrowableType,
  TracingFrame,
} from './shared/types';
import { cloneInstance, getErrorCause } from './shared/utils';

export class SerializedChunk {
  id?: string | number;

  name?: string;

  entry?: boolean;

  initial?: boolean;
}

export class SerializedModule {
  id?: string | number;

  identifier?: string;

  name?: string;

  trace?: StatsModuleTraceItem[];
}

export type Serializable<T> = {
  [K in keyof T]: T[K] extends JSONValue ? T[K] : never;
};

export interface ParseOptions {
  withSources?: boolean;
  type?: ThrowableType;
  compiler: Compiler;
}

export type ErrorShape = object;

export class ParsedError<E extends ErrorShape = ErrorShape> {
  type: ThrowableType = 'error';

  cause?: ParsedError;

  trace: TracingFrame[] = [];

  parent?: ParsedError;

  name: string = 'Error';

  message: string = '';

  compiler: Compiler;

  chunk?: Chunk | SerializedChunk;

  module?: Module | SerializedModule;

  private raw: E;

  constructor(error: E, options: ParseOptions) {
    this.raw = error;
    if ('name' in this.raw && typeof this.raw.name === 'string') {
      this.name = this.raw.name;
    }
    if ('message' in this.raw && typeof this.raw.message === 'string') {
      this.message = this.raw.message;
    }
    if (typeof options.type === 'string') {
      this.type = options.type;
    }
    this.type = options.type ?? this.type;
    this.compiler = options.compiler;

    this.parseErrorStack(options.withSources);
    this.parseChunk();
    this.parseModule();
    this.parseCauses(options);
  }

  private parseCauses(options: ParseOptions) {
    // Parse cause errors.
    const rawCause = getErrorCause(this.raw);
    if (rawCause) {
      this.cause = new ParsedError(rawCause, options);
      this.cause.parent = this;
    }
  }

  private parseModule() {
    if (
      'module' in this.raw &&
      this.raw.module instanceof this.compiler.webpack.Module
    ) {
      this.module = this.raw.module;
    } else {
      this.module = new SerializedModule();
      if (
        'moduleId' in this.raw &&
        (_.isString(this.raw.moduleId) || _.isNumber(this.raw.moduleId))
      ) {
        this.module.id = this.raw.moduleId;
      }
      if (
        'moduleIdentifier' in this.raw &&
        _.isString(this.raw.moduleIdentifier)
      ) {
        this.module.identifier = this.raw.moduleIdentifier;
      }
      if ('moduleName' in this.raw && _.isString(this.raw.moduleName)) {
        this.module.name = this.raw.moduleName;
      }
      if ('moduleTrace' in this.raw && _.isArray(this.raw.moduleTrace)) {
        this.module.trace = this.raw.moduleTrace;
      }
      if (_.isEmpty(this.module)) {
        delete this.module;
      }
    }
  }

  private parseChunk() {
    if (
      'chunk' in this.raw &&
      this.raw.chunk instanceof this.compiler.webpack.Chunk
    ) {
      this.chunk = this.raw.chunk;
    } else {
      this.chunk = new SerializedChunk();
      if ('chunkName' in this.raw && _.isString(this.raw.chunkName)) {
        this.chunk.name = this.raw.chunkName;
      }
      if ('chunkEntry' in this.raw && _.isBoolean(this.raw.chunkEntry)) {
        this.chunk.entry = this.raw.chunkEntry;
      }
      if ('chunkInitial' in this.raw && _.isBoolean(this.raw.chunkInitial)) {
        this.chunk.initial = this.raw.chunkInitial;
      }
      if (
        'chunkId' in this.raw &&
        (_.isString(this.raw.chunkId) || _.isNumber(this.raw.chunkId))
      ) {
        this.chunk.id = this.raw.chunkId;
      }
      if (_.isEmpty(this.chunk)) {
        delete this.chunk;
      }
    }
  }

  private parseErrorStack(withSources = false) {
    // Parse error stacks.
    let traceyInput: Error | string = '';
    if (this.raw instanceof Error) {
      traceyInput = this.raw;
    } else if ('stack' in this.raw && typeof this.raw.stack === 'string') {
      traceyInput = this.raw.stack;
    }
    if (withSources) {
      this.trace = new StackTracey(traceyInput).withSources().items;
    } else {
      this.trace = new StackTracey(traceyInput).items;
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
