import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  tools: {
    devServer: {
      devMiddleware: {
        writeToDisk: false,
      },
    },
  },
});
