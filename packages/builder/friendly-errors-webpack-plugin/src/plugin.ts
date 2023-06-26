import type * as webpack from 'webpack';
import { outputPrettyError } from './core/output';
import { ContextInitiationOptions } from './core/context';

export class FriendlyErrorsWebpackPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = 'FriendlyErrorsWebpackPlugin' as const;

  options: ContextInitiationOptions;

  constructor(options?: ContextInitiationOptions) {
    this.options = options ?? {};
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tapPromise(this.name, async stats => {
      {
        const opts: ContextInitiationOptions = {
          ...this.options,
          type: 'warning',
        };
        const warnings = stats.compilation.getWarnings();
        for (const warning of warnings) {
          outputPrettyError(warning, opts);
        }
      }
      {
        const opts: ContextInitiationOptions = {
          ...this.options,
          type: 'error',
        };
        const errors = stats.compilation.getErrors();
        for (const error of errors) {
          outputPrettyError(error, opts);
        }
      }
    });
  }
}
