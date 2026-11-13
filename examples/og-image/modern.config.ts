import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';

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

export default defineConfig({
  plugins: [appTools(), bffPlugin()],
  server: {
    ssr: { mode: 'string' },
  },
  source: {
    define: {
      'process.env.SITE_URL': JSON.stringify(siteUrl.origin),
    },
  },
});
