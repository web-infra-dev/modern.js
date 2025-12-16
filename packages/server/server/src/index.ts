import type { DevServerOptions } from './types';
export { createDevServer } from './createDevServer';
export type {
  ModernDevServerOptions,
  ApplyPlugins,
  CorsOptions,
} from './types';

// export for @modern-js/app-tools to override rsbuild dev.setupMiddlewares type
export type SetupMiddlewares = DevServerOptions['setupMiddlewares'];
