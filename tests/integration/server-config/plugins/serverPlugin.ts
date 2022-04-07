import type { ServerPlugin } from '@modern-js/server-core';

export default (): ServerPlugin => ({
  name: 'serverPlugin1',
  setup: () => {
    return {
      config(serverConfig) {
        if (serverConfig.bff?.proxy) {
          serverConfig.bff.proxy['/foo'] = {
            target: 'https://api.github.com',
            pathRewrite: { '/foo/modernjs': '/repos/modern-js-dev/modern.js' },
            changeOrigin: true,
          };
        }
        return serverConfig;
      },

      async prepareApiServer() {
        return (req, res) => {
          res.end('Hello Modernjs');
        };
      },
    };
  },
});
