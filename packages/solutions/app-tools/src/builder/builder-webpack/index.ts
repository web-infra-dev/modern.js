import { generateBuilder } from '../generator';
import type { BuilderOptions } from '../shared';

export async function createWebpackBuilderForModern(
  options: BuilderOptions<'webpack'>,
) {
  const builder = await generateBuilder(options, 'webpack');
  return builder;
}
