import path from 'path';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';

export const compiler = (entryFile: string, target: string) => {
  const compiler = webpack({
    context: __dirname,
    entry: entryFile,
    target,
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    module: {
      rules: [
        {
          test: /create-request/,
          use: {
            loader: path.resolve(__dirname, './mock-ts-loader.ts'),
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
