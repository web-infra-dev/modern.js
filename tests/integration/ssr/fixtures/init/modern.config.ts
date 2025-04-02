import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  server: {
    ssr: true,
  },
  source: {
    enableAsyncEntry: true,
    enableCustomEntry: true,
  },
});
