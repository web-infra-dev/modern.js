import type { AppUserConfig } from '@modern-js/app-tools';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

type ServerConfig = NonNullable<AppUserConfig['server']>;

// Tests start the server with each value of `server.staticCacheControl`.
const staticCacheControlVariants: Record<
  string,
  ServerConfig['staticCacheControl']
> = {
  true: true,
  false: false,
  custom: {
    hashed: 'public, max-age=86400',
    unhashed: 'public, max-age=300',
  },
  'hashed-only': {
    hashed: 'public, max-age=600',
  },
};

export default applyBaseConfig({
  output: {
    copy: [{ from: './src/assets', to: '' }],
    // Each test file builds into its own directory, so they can run in parallel.
    distPath: {
      root: process.env.TEST_DIST || 'dist',
    },
    // Emit images as files, so there is a hashed media asset.
    dataUriLimit: 0,
  },
  server: {
    // `static/locales` is inside a build asset directory, but its files are
    // still user files, not build assets.
    publicDir: ['./locales', './static/locales'],
    publicRoutes: {
      'remapped.txt': '/renamed.txt',
    },
    staticCacheControl:
      staticCacheControlVariants[process.env.STATIC_CACHE_CONTROL || ''],
  },
});
