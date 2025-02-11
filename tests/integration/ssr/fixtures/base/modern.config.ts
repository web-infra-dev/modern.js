import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: {
      disablePrerender: true,
      unsafeHeaders: ['Host'],
    },
  },
  tools: {
    bundlerChain(chain) {
      chain.output.chunkLoadingGlobal('hello xxx');
    },
  },
});
