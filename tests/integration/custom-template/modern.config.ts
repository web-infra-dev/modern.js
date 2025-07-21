import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  html: {
    template: './src/index.html',
  },
  output: {
    filenameHash: false,
    disableInlineRuntimeChunk: true,
  },
  performance: { chunkSplit: { strategy: 'all-in-one' } },
});
