import { logger } from '@modern-js/utils';

export async function createBuilderGenerator(bundler: 'webpack' | 'rspack') {
  if (bundler === 'rspack') {
    try {
      const { createRspackBuilderForModern } = await import('./builder-rspack');
      logger.info('Using Rspack ✨');
      return createRspackBuilderForModern;
    } catch (_) {
      throw new Error(
        'Failed to use Rspack, please check if you have `@modern-js/builder-rspack-provider` installed',
      );
    }
  }

  const { createWebpackBuilderForModern } = await import('./builder-webpack');
  return createWebpackBuilderForModern;
}
