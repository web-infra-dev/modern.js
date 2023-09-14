import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  dev: {
    assetPrefix: true,
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
});
