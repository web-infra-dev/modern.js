import path from 'path';
import type { RsbuildPlugin } from '@modern-js/uni-builder';
import { logger, removeTailSlash } from '@modern-js/utils';
import fs from '@modern-js/utils/fs-extra';
import { type BuilderOptions, createCopyInfo } from '../shared';

export const builderPluginAdpaterCopy = (
  options: BuilderOptions<'rspack'>,
): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-rspack-copy',
  setup(api) {
    let publicPath: string | undefined | ((...args: any[]) => string);
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
        {
          patterns: [
            ...(args[0]?.patterns || []),
            ...createConfigBuiltinCopy(options),
          ],
        },
      ]);
    });
    api.modifyRspackConfig(config => {
      publicPath = config.output?.publicPath;
    });
    api.onDevCompileDone(async () => {
      await transformHtmlFiles();
    });

    api.onAfterBuild(async () => {
      await transformHtmlFiles();
    });

    /** transform public/*.html manaully */
    async function transformHtmlFiles() {
      const { normalizedConfig } = options;
      const publicDir = path.resolve(
        normalizedConfig.output.distPath?.root || './dist',
        './public',
      );

      if (!fs.existsSync(publicDir) || !fs.statSync(publicDir).isDirectory()) {
        return;
      }

      const HTML_REGEXP = /\.html?$/;

      const filepaths = (await fs.readdir(publicDir)).map(file =>
        path.resolve(publicDir, file),
      );

      await Promise.all(
        filepaths
          .filter(file => HTML_REGEXP.test(file))
          .map(async file => {
            const content = await fs.readFile(file, 'utf-8');
            if (publicPath && typeof publicPath === 'string') {
              await fs.writeFile(
                file,
                content.replace(
                  /<%=\s*assetPrefix\s*%>/g,
                  removeTailSlash(publicPath),
                ),
              );
            } else {
              logger.warn(
                `Expect get a string from \`publicPath\`, but receive \`${typeof publicPath}\`.`,
              );
              await fs.writeFile(
                file,
                content.replace(
                  /<%=\s*assetPrefix\s*%>/g,
                  removeTailSlash('/'),
                ),
              );
            }
          }),
      );
    }
  },
});

function createConfigBuiltinCopy(options: BuilderOptions<'rspack'>) {
  const { normalizedConfig, appContext } = options;
  const { publicDir } = createCopyInfo(appContext, normalizedConfig);

  return [
    {
      from: '**/*',
      to: 'public',
      context: publicDir,
      noErrorOnMissing: true,
    },
  ];
}
