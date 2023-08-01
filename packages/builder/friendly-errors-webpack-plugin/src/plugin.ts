import type * as webpack from 'webpack';
import { Context } from './context';
import { ParseOptions, ParsedError } from './parse';
import type { ErrorFormatter, ErrorTransformer } from './shared/types';

export interface Options {
  withSources?: boolean;
  formatters?: ErrorFormatter[];
  transformers?: ErrorTransformer[];
  output?: Context['output'];
}

export class FriendlyErrorsWebpackPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = 'FriendlyErrorsWebpackPlugin' as const;

  options: Options;

  constructor(options?: Options) {
    this.options = options ?? {};
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tapPromise(this.name, async stats => {
      const ctx = new Context(this.options);
      const parseOpts: ParseOptions = {
        withSources: ctx.withSources,
        compiler,
      };

      parseOpts.type = 'warning';
      const warnings = stats.compilation.getWarnings();
      for (const warning of warnings) {
        const prettied = new ParsedError(warning, parseOpts)
          .transform(...ctx.transformers)
          .inspect(...ctx.formatters);
        prettied && ctx.output(prettied, 'warning');
      }

      parseOpts.type = 'error';
      const errors = stats.compilation.getErrors();
      for (const error of errors) {
        const prettied = new ParsedError(error, parseOpts)
          .transform(...ctx.transformers)
          .inspect(...ctx.formatters);
        prettied && ctx.output(prettied, 'error');
      }
    });
  }
}
