import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import { BuilderInstance } from '@modern-js/builder-shared';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginNodePolyfill } from './plugin-node-polyfill';

export function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
) {
  // Todo Copy config/upload
  return generateBuilder(options, builderRspackProvider, {
    async modifyBuilderInstance(builder) {
      applyBuilderPlugins(builder, options);
    },
  });
}

/** register builder Plugin by condition */
async function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions<'rspack'>,
) {
  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    builder.addPlugins([builderPluginNodePolyfill()]);
  }
}
