import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  source: {
    enableCustomEntry: true,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
});
