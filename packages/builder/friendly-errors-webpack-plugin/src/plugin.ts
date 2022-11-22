import type * as webpack from 'webpack';
import { outputPrettyError, OutputPrettyErrorOptions } from './shared/utils';

export class FriendlyErrorsWebpackPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = 'FriendlyErrorsWebpackPlugin' as const;

  options: OutputPrettyErrorOptions;

  constructor(options?: OutputPrettyErrorOptions) {
    this.options = options ?? {};
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tapPromise(this.name, async stats => {
      const opts = { ...this.options };
      const warnings = stats.compilation.getWarnings();
      opts.type = 'warning';
      for (const warning of warnings) {
        outputPrettyError(warning, opts);
      }
      const errors = stats.compilation.getErrors();
      opts.type = 'error';
      for (const error of errors) {
        outputPrettyError(error, opts);
      }
    });
  }
}
