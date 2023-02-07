import { builderRspackProvider } from '@modern-js/builder-rspack-provider';
import { BuilderOptions } from '../shared';
import { generateBuilder } from '../generator';

export function createRspackBuilderForModern(
  options: BuilderOptions<'rspack'>,
) {
  return generateBuilder(options, builderRspackProvider);
}
