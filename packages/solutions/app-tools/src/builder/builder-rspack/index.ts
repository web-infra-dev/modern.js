import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import { logger } from '@modern-js/utils';
import chalk from '@modern-js/utils/chalk';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginAdpaterCopy } from './adapterCopy';

export type RspackFuture = {
  disableTransformByDefault?: boolean;
};

export async function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
  rspackFuture: RspackFuture,
) {
  if (!rspackFuture.disableTransformByDefault) {
    process.env.INTERNAL_USE_RSPACK_TRANSFORM_LEGACY = 'true';

    logger.warn(`The default full transform behavior will be deprecate in rspack 0.5.0 version. Please enable 'rspackFuture.disableTransformByDefault' as soon as possible:

    module.exports = {
      ...,
      plugins: [appTools({
          bundler: 'experimental-rspack',
          ${chalk.yellow.bold(`rspackFuture: {
            disableTransformByDefault: true,
          }`)}
        },
      )}), ...],

    - If you want to downgrade the syntax, you can compile the corresponding module through the \`source.include\` config.
    - If you do not know which modules should be added with downgrade, you can check by enabling \`security.checkSyntax\` config.\n`);
  }

  const builder = await generateBuilder(options, builderRspackProvider);
  builder.addPlugins([builderPluginAdpaterCopy(options)]);
  return builder;
}
