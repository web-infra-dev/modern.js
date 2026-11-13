import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { baseConfig } from './config/base';
import { getBffImagePath, posts } from './shared/posts';

// Optional request-time alternative. The default config never imports BFF.
export default defineConfig({
  ...baseConfig,
  plugins: [appTools(), bffPlugin()],
  source: {
    ...baseConfig.source,
    define: {
      ...baseConfig.source.define,
      __OG_IMAGE_PATHS__: JSON.stringify(
        Object.fromEntries(
          posts.map(post => [post.slug, getBffImagePath(post.slug)]),
        ),
      ),
    },
  },
});
