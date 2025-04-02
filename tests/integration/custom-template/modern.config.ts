import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  html: {
    template: './src/index.html',
  },
  output: {
    disableFilenameHash: true,
    disableInlineRuntimeChunk: true,
  },
  performance: { chunkSplit: { strategy: 'all-in-one' } },
});
