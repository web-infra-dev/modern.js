import type * as webpack from 'webpack';
import { outputPrettyError } from './core/output';
import { Context, ContextInitiationOptions } from './core/context';

export type Options = Omit<ContextInitiationOptions, 'type'>;

export class FriendlyErrorsWebpackPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = 'FriendlyErrorsWebpackPlugin' as const;

  options: Options;

  constructor(options?: Options) {
    this.options = options ?? {};
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tapPromise(this.name, async stats => {
      {
        const ctx = new Context({
          ...this.options,
          type: 'warning',
        });
        const warnings = stats.compilation.getWarnings();
        for (const warning of warnings) {
          outputPrettyError(warning, ctx);
        }
      }
      {
        const ctx = new Context({
          ...this.options,
          type: 'error',
        });
        const errors = stats.compilation.getErrors();
        for (const error of errors) {
          outputPrettyError(error, ctx);
        }
      }
    });
  }
}
