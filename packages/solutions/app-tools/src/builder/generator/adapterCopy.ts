import path from 'path';
import type { RsbuildPlugin } from '@modern-js/builder';
import type { BuilderOptions } from '../shared';
import { createCopyInfo } from '../shared';
import { createPublicPattern } from './createCopyPattern';

export const builderPluginAdapterCopy = (
  options: BuilderOptions,
): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-copy',

  setup(api) {
    const { normalizedConfig: modernConfig, appContext } = options;

    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      // apply copy plugin
      if (chain.plugins.has(CHAIN_ID.PLUGIN.COPY)) {
        const defaultCopyPattern = createPublicPattern(
          appContext,
          modernConfig,
          chain,
        );

        const { customPublicDirs } = createCopyInfo(appContext, modernConfig);

        // Create copy patterns for custom public dirs
        const customCopyPatterns = customPublicDirs.map(customPublicDir => {
          // Get the relative path from app directory to determine the output directory name
          const relativePath = path.relative(
            appContext.appDirectory,
            customPublicDir,
          );
          const outputDir = relativePath || path.basename(customPublicDir);

          return {
            from: '**/*',
            to: outputDir,
            context: customPublicDir,
            noErrorOnMissing: true,
          };
        });

        chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
          {
            patterns: [
              ...(args[0]?.patterns || []),
              defaultCopyPattern,
              ...customCopyPatterns,
            ],
          },
        ]);
      }
    });
  },
});
