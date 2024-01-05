import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      scriptLoading: 'async',
    },
  },

  runtime: {
    router: true,
  },
});
