import path from 'path';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import { APILoaderOptions } from '../src/loader';

// globby needs setImmediate
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.setImmediate = setTimeout;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.clearImmediate = clearTimeout;

export const compiler = (fixture: string, options: APILoaderOptions) => {
  const compiler = webpack({
    context: __dirname,
    entry: fixture,
    target: 'node',
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: path.resolve(__dirname, '../src/loader.ts'),
            options,
          },
        },
      ],
    },
    resolve: { extensions: ['.ts', '...'] },
  });

  compiler.outputFileSystem = createFsFromVolume(new Volume());
  compiler.outputFileSystem.join = path.join.bind(path);

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
