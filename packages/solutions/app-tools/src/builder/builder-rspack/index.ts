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
    modifyBuilderConfig(config) {
      // We need to do this in the app-tools prepare hook because some files will be generated into the dist directory in the analyze process
      config.output.cleanDistPath = false;
    },
  });
}

function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions<'rspack'>,
) {
  builder.addPlugins([builderPluginAdapterModern<'rspack'>(options)]);
}
