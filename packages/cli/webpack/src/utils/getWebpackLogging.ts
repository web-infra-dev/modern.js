const nodeConsole = require('webpack/lib/node/nodeConsole');

const webpackLogger = nodeConsole({
  colors: process.env.isTTY,
  appendOnly: !process.env.isTTY,
  stream: process.stderr,
});

export const getWebpackLogging = () => ({
  level: 'info',
  console: {
    ...webpackLogger,
    info: (...args: any[]) => {
      const messages = args.filter(arg => !/\[webpack-dev-server\]/.test(arg));
      if (messages.length) {
        webpackLogger.info(...messages);
      }
    },
    warn: (...args: any[]) => {
      const messages = args.filter(
        arg =>
          !/\[webpack.cache.PackFileCacheStrategy/.test(arg) &&
          !/\[webpack-dev-server\]/.test(arg),
      );
      if (messages.length) {
        webpackLogger.warn(...messages);
      }
    },
  },
});
