import type * as webpack from 'webpack';

export interface Formatter {
  test: (error: webpack.WebpackError) => boolean;
  format: (error: webpack.WebpackError) => string;
}

// const builtinFormatters: Formatter = [];

export class FriendlyErrorsWebpackPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = 'FriendlyErrorsWebpackPlugin' as const;

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.done.tapPromise(this.name, async _stats => {
      // const errors = stats.compilation.getErrors();
      // const warnings = stats.compilation.getWarnings();
    });
  }
}
