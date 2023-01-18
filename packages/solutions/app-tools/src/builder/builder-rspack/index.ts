import { BuilderInstance } from '@modern-js/builder';
import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import { builderPluginAdapterModern, BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';

export function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
) {
  return generateBuilder(options, builderRspackProvider, {
    modifyBuilderInstance(builder) {
      applyBuilderPlugins(builder, options);
    },
  });
}

function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions<'rspack'>,
) {
  builder.addPlugins([builderPluginAdapterModern<'rspack'>(options)]);
}
