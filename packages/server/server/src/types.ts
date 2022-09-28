import type webpack from 'webpack';
import type {
  DevServerOptions,
  DevServerHttpsOptions,
  DevMiddlewareAPI,
} from '@modern-js/types';
import type { ModernServerOptions } from '@modern-js/prod-server';

export type { DevServerOptions, DevServerHttpsOptions, DevMiddlewareAPI };

export type ExtraOptions = {
  dev: boolean | Partial<DevServerOptions>;
  compiler: webpack.MultiCompiler | webpack.Compiler | null;
};

export type ModernDevServerOptions = ModernServerOptions & ExtraOptions;
