import { applyBaseConfig } from '../../utils/applyBaseConfig';

process.env.BUNDLER = 'webpack';
export default applyBaseConfig({
  tools: {
    babel: {
      plugins: ['@babel/plugin-proposal-import-wasm-source'],
    },
  },
  server: {
    ssr: true,
  },
  performance: {
    buildCache: false,
  },
});
