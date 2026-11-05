import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'string',
      unsafeHeaders: ['Host'],
      deferredDataTimeout: 100,
    },
  },
  tools: {
    bundlerChain(chain) {
      chain.output.chunkLoadingGlobal('hello xxx');
    },
  },
});
