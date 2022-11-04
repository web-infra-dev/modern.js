import type * as webpack from 'webpack';
import { prettyFormatter } from './formatter';
import {
  ErrorFormatter,
  ErrorTransformer,
  ThrowableType,
} from './shared/types';
import { formatError, parseError, transformError } from './shared/utils';
import { transformModuleParseError } from './transformer';

export interface Options {
  output?: (msg: string, type: ThrowableType) => any;
  formatters?: boolean | ErrorFormatter[];
  transformers?: boolean | ErrorTransformer[];
}

export interface Context extends Required<Options> {
  formatters: ErrorFormatter[];
  transformers: ErrorTransformer[];
}

const outputFormattedError: Options['output'] = (msg, type) => {
  if (type === 'error') {
    console.error(msg);
  } else if (type === 'warning') {
    console.warn(msg);
  }
};

const createContext = (options: Options = {}): Context => {
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
    transformers.push(transformModuleParseError);
  }
  return {
    output,
    formatters,
    transformers,
  };
};

export class FriendlyErrorsWebpackPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = 'FriendlyErrorsWebpackPlugin' as const;

  ctx: Context;

  constructor(options?: Options) {
    this.ctx = createContext(options);
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tapPromise(this.name, async stats => {
      const warnings = stats.compilation.getWarnings();
      for (const warning of warnings) {
        const parsed = parseError(warning, 'warning');
        const transformed = transformError(this.ctx.transformers, parsed);
        const formatted = formatError(this.ctx.formatters, transformed);
        this.ctx.output(formatted, 'warning');
      }
      const errors = stats.compilation.getErrors();
      for (const error of errors) {
        const parsed = parseError(error, 'error');
        const transformed = transformError(this.ctx.transformers, parsed);
        const formatted = formatError(this.ctx.formatters, transformed);
        this.ctx.output(formatted, 'error');
      }
    });
  }
}
