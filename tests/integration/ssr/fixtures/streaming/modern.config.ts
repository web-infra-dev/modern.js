import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  source: {
    enableCustomEntry: true,
  },
  dev: {
    https: true,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
});
