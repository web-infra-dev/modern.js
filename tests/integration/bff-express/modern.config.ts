import { defineLegacyConfig } from '@modern-js/app-tools';

export default defineLegacyConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
  },
});
