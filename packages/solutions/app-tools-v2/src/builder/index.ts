export async function createBuilderGenerator(bundler: 'webpack' | 'rspack') {
  if (bundler === 'rspack') {
    const { createRspackBuilderForModern } = await import('./builder-rspack');
    return createRspackBuilderForModern;
  }

  const { createWebpackBuilderForModern } = await import('./builder-webpack');
  return createWebpackBuilderForModern;
}
