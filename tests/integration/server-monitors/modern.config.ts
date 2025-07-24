import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      disablePrerender: true,
    },
  },
  runtime: {
    router: true,
    state: false,
  },
});
