import { appTools } from './new/index';
export * from './new/index';
export { dev } from './commands/dev';
export type { DevOptions } from './utils/types';

export { mergeConfig } from '@modern-js/core';
export * from './defineConfig';
export * from './types';

export type { RuntimeUserConfig } from './types/config';

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'rspack' | 'webpack' | 'experimental-rspack';
};

export default appTools;
