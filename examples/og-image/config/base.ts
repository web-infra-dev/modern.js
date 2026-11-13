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

export const baseConfig = {
  // Page rendering is independent of image generation. Both examples use SSR.
  server: { ssr: { mode: 'string' as const } },
  source: {
    define: { 'process.env.SITE_URL': JSON.stringify(siteUrl.origin) },
  },
};
