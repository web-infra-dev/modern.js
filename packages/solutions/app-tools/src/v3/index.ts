import type { Plugin } from '@modern-js/plugin-v2';
import type { AppTools } from './types';

export * from '../defineConfig';

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'rspack' | 'webpack' | 'experimental-rspack';
};

export const appTools = (
  options: AppToolsOptions = {
    // default webpack to be compatible with original projects
    bundler: 'webpack',
  },
): Plugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-app-tools',
  setup: api => {
    api.onPrepare(() => {
      console.log('app-tools prepare', options);
    });
  },
});
