import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: {
      disablePrerender: true,
    },
  },
  source: {
    enableAsyncEntry: true,
  },
});
