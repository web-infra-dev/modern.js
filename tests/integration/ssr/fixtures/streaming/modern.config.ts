import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: true,
  },
  performance: {
    prefetch: true,
  },
});
