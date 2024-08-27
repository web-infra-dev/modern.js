import { generateBuilder } from '../generator';
import type { BuilderOptions } from '../shared';
import { builderPluginAdpaterCopy } from './adapterCopy';

export async function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
) {
  const builder = await generateBuilder(options, 'rspack');
  builder.addPlugins([builderPluginAdpaterCopy(options)]);
  return builder;
}
