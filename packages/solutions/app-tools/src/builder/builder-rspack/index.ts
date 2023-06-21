import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';
import { builderPluginAdpaterCopy } from './adapterCopy';

export async function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
) {
  const builder = await generateBuilder(options, builderRspackProvider);
  builder.addPlugins([builderPluginAdpaterCopy(options)]);
  return builder;
}
