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
    info: (...messages: string[]) => {
      if (messages.length) {
        webpackLogger.info(...messages);
      }
    },
    warn: (...messages: string[]) => {
      const filtered = messages.filter(
        message => !/\[webpack.cache.PackFileCacheStrategy/.test(message),
      );
      if (filtered.length) {
        webpackLogger.warn(...filtered);
      }
    },
  },
});
