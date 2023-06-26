import webpack, { Configuration } from 'webpack';

// compiler needs setImmediate
// @ts-expect-error
global.setImmediate = setTimeout;

export const compiler = (config: Configuration) => {
  const compiler = webpack(config);

  return new Promise<webpack.Stats | undefined>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }
      if (stats?.hasErrors()) {
        reject(stats.toJson().errors);
      }

      resolve(stats);
    });
  });
};
