import { appTools, defineConfig } from '@modern-js/app-tools';
import { buildOgImagesPlugin } from './config/build-og-images';
import { getBffImagePath, posts } from './shared/posts';

export default defineConfig(async () => {
  // This environment variable is an example-specific switch.
  const imageMode = process.env.OG_IMAGE_MODE || 'build';
  if (!['build', 'bff'].includes(imageMode)) {
    throw new Error('OG_IMAGE_MODE must be "build" or "bff"');
  }
  const useBff = imageMode === 'bff';

  // Use an explicit public origin, rather than trusting request Host headers.
  const siteUrl = new URL(process.env.SITE_URL || 'http://localhost:8080');
  if (
    !['http:', 'https:'].includes(siteUrl.protocol) ||
    siteUrl.pathname !== '/' ||
    siteUrl.search ||
    siteUrl.hash ||
    siteUrl.username ||
    siteUrl.password
  ) {
    throw new Error(
      'SITE_URL must be an HTTP(S) origin, e.g. https://example.com',
    );
  }

  // Load BFF only when explicitly selected. The default generates static PNGs.
  const imagePlugin = useBff
    ? (await import('@modern-js/plugin-bff')).bffPlugin()
    : buildOgImagesPlugin();

  return {
    plugins: [appTools(), imagePlugin],
    // Page rendering is independent of image generation. Both modes use SSR.
    server: { ssr: { mode: 'string' } },
    source: {
      define: {
        'process.env.SITE_URL': JSON.stringify(siteUrl.origin),
        ...(useBff
          ? {
              __OG_IMAGE_PATHS__: JSON.stringify(
                Object.fromEntries(
                  posts.map(post => [post.slug, getBffImagePath(post.slug)]),
                ),
              ),
            }
          : {}),
      },
    },
  };
});
