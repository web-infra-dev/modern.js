import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginAdpaterCopy } from './adapterCopy';

export function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
) {
  // Todo Copy config/upload
  return generateBuilder(options, builderRspackProvider, {
    modifyBuilderInstance(builder) {
      builder.addPlugins([builderPluginAdpaterCopy(options)]);
    },
  });
}
