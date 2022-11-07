import type * as webpack from 'webpack';
import type { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import { prettyFormatter } from './formatter';
import {
  ErrorFormatter,
  ErrorTransformer,
  ThrowableType,
  WithSourcesMixin,
} from './shared/types';
import { formatError, parseError, transformError } from './shared/utils';
import { transformModuleParseError } from './transformer';

export interface Options extends WithSourcesMixin {
  output?: (msg: string, type: ThrowableType) => any;
  formatters?: boolean | ErrorFormatter[];
  transformers?: boolean | ErrorTransformer[];
  cwd?: boolean | string;
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
  const cwd = options.cwd || process.cwd();
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
    cwd,
    output,
    formatters,
    transformers,
    withSources: options.withSources ?? true,
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
        const parsed = parseError(warning, 'warning', this.ctx);
        const transformed = transformError(this.ctx.transformers, parsed);
        const formatted = formatError(this.ctx.formatters, transformed);
        this.ctx.output(formatted, 'warning');
      }
      const errors = stats.compilation.getErrors();
      for (const error of errors) {
        const parsed = parseError(error, 'error', this.ctx);
        const transformed = transformError(this.ctx.transformers, parsed);
        const formatted = formatError(this.ctx.formatters, transformed);
        this.ctx.output(formatted, 'error');
      }
    });
  }
}

export const CHAIN_ID = {
  PLUGIN: { FRIENDLY_ERROR: 'friendly-error' },
} as const;

export const PluginFriendlyErrors = (
  options?: Options,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'friendly-errors',
  setup(api) {
    api.modifyWebpackChain(chain => {
      chain
        .plugin(CHAIN_ID.PLUGIN.FRIENDLY_ERROR)
        .use(FriendlyErrorsWebpackPlugin, [options]);
    });
  },
});
