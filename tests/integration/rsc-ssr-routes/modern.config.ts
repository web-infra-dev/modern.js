import path from 'path';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    rsc: true,
    ssr: {
      mode: 'stream',
    },
  },
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
});
