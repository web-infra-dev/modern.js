import type { LibuildPlugin } from '@modern-js/libuild';
import type { BaseBuildConfig, BaseBundleBuildConfig } from '../types';

export const watchPlugin = (config: BaseBuildConfig): LibuildPlugin => {
  return {
    name: 'watch-plugin',
    apply(compiler) {
      compiler.hooks.watchChange.tap('watch-plugin', async () => {
        const { watchSectionTitle } = await import('./log');
        const { SectionTitleStatus } = await import('../constants/log');
        const titleText = `[${
          config.buildType === 'bundle' ? 'Bundle' : 'Bundleless'
        }:${config.format}_${config.target}]`;
        console.info(
          await watchSectionTitle(titleText, SectionTitleStatus.Log),
        );
      });
    },
  };
};

export const externalPlugin = (
  config: BaseBundleBuildConfig,
  options: { appDirectory: string },
): LibuildPlugin => {
  return {
    name: 'external-plugin',
    apply(compiler) {
      compiler.hooks.initialize.tapPromise('external-plugin', async () => {
        const { getFinalExternals } = await import('./builder');
        const finalExternals = await getFinalExternals(config, options);
        compiler.config.external = finalExternals;
      });
    },
  };
};
