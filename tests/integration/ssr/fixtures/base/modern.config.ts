import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: true,
  },
  tools: {
    bundlerChain(chain) {
      chain.output.chunkLoadingGlobal('hello xxx');
    },
  },
});
