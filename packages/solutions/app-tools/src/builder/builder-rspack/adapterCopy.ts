import path from 'path';
import { BuilderPlugin } from '@modern-js/builder-shared';
import { BuilderPluginAPI } from '@modern-js/builder-rspack-provider';
import fs from '@modern-js/utils/fs-extra';
import { logger, removeTailSlash } from '@modern-js/utils';
import { BuilderOptions, createCopyInfo } from '../shared';

export const builderPluginAdpaterCopy = (
  options: BuilderOptions<'rspack'>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-adapter-rspack-copy',
  setup(api) {
    let publicPath: string | undefined;
    api.modifyRspackConfig(config => {
      config.builtins = {
        ...(config.builtins || {}),
        copy: {
          patterns: [
            ...(config.builtins?.copy?.patterns || []),
            ...createConfigBuiltinCopy(options),
          ],
        },
      };
      publicPath = config.output?.publicPath;
    });
    api.onDevCompileDone(async () => {
      await transformHtmlFiles();
    });

    api.onAfterBuild(async () => {
      await transformHtmlFiles();
    });

    /** tramsform public/*.html manaully */
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
            if (publicPath) {
              await fs.writeFile(
                file,
                content.replace(
                  /<%=\s*assetPrefix\s*%>/g,
                  removeTailSlash(publicPath),
                ),
              );
            } else {
              logger.warn(
                'Expect get a string from `publicPath`, but receive `undefined`.',
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
  const { uploadDir, publicDir } = createCopyInfo(appContext, normalizedConfig);

  return [
    {
      from: '**/*',
      to: 'public',
      context: publicDir,
      noErrorOnMissing: true,
    },
    {
      from: '**/*',
      to: 'upload',
      context: uploadDir,
      noErrorOnMissing: true,
    },
  ];
}
