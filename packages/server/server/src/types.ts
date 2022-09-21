import type webpack from 'webpack';
import type { DevServerOptions, DevServerHttpsOptions } from '@modern-js/types';
import type { ModernServerOptions } from '@modern-js/prod-server';

export type { DevServerOptions, DevServerHttpsOptions };

export type ExtraOptions = {
  dev: boolean | Partial<DevServerOptions>;
  compiler: webpack.MultiCompiler | webpack.Compiler | null;
};

export type ModernDevServerOptions = ModernServerOptions & ExtraOptions;
