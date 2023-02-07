export async function createBuilderForModernGenerator(
  bundler: 'webpack' | 'rspack',
) {
  if (bundler === 'webpack') {
    const { createWebpackBuilderForModern } = await import('./builder-webpack');
    return createWebpackBuilderForModern;
  }

  const { createRspackBuilderForModern } = await import('./builder-rspack');
  return createRspackBuilderForModern;
}
