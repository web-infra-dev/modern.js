import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: {
      forceCSR: true,
    },
  },
  tools: {
    bundlerChain(chain) {
      chain.output.chunkLoadingGlobal('hello xxx');
    },
  },
});
