import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'stream',
    },
    ssrByEntries: {
      main: {
        unsafeHeaders: ['host'],
      },
    },
  },

  runtime: {
    router: true,
  },
});
