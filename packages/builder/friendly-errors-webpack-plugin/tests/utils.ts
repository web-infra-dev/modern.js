import { webpack, Configuration } from 'webpack';

export const webpackPromise = (config: Configuration) => {
  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });
};
