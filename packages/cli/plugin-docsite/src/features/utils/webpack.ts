import path from 'path';
import { fs } from '@modern-js/utils';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration, WebpackPluginInstance } from 'webpack';
import { getWebpackConfig, WebpackConfigTarget } from '@modern-js/webpack';
import { UTILS_STATIC } from '../constant';

interface Alias {
  [index: string]: string | false | string[];
}

export function generatorWebpackConfig(
  appDirectory: string,
  tmpDir: string,
  isDev: boolean,
): Configuration {
  const originConfig: any = getWebpackConfig(WebpackConfigTarget.CLIENT);
  const plugins = (
    (originConfig.plugins || []) as WebpackPluginInstance[]
  ).filter(p => p.constructor !== webpack.HotModuleReplacementPlugin);
  const config: Configuration = {
    mode: isDev ? 'development' : 'production',
    context: tmpDir,
    entry: { index: path.resolve(tmpDir, 'docs-entry.jsx') },
    output: { path: path.resolve(appDirectory, 'dist/docs') },
    resolve: originConfig.resolve || { alias: {} },
    module: originConfig.module,
    plugins: [
      ...plugins,
      new HtmlWebpackPlugin({
        templateContent: fs.readFileSync(
          path.resolve(UTILS_STATIC, 'index.html.ejs'),
          'utf8',
        ),
      }),
    ],
  };

  config.resolve!.modules = [
    ...(config.resolve!.modules || []),
    path.join(__dirname, '../../../../../', 'node_modules'),
  ];
  (config.resolve!.alias as Alias)['@assets'] = path.resolve(
    appDirectory,
    'assets',
  );
  (config.resolve!.alias as Alias)['@styles'] = path.resolve(
    appDirectory,
    'styles',
  );
  // fix this since react-live relies on core-js@2
  (config.resolve!.alias as Alias)[
    `${path.dirname(require.resolve('core-js'))}/fn`
  ] = 'core-js/es';

  const pkgJSON = JSON.parse(
    fs.readFileSync(path.join(appDirectory, 'package.json'), 'utf-8'),
  );

  if (pkgJSON.dependencies.react || pkgJSON.devDependencies.react) {
    (config.resolve!.alias as Alias).react = path.resolve('node_modules/react');
  } else {
    (config.resolve!.alias as Alias).react = path.resolve(
      __dirname,
      '../../../../../',
      'node_modules',
      'react',
    );
  }
  if (
    pkgJSON.dependencies['react-dom'] ||
    pkgJSON.devDependencies['react-dom']
  ) {
    (config.resolve!.alias as Alias)['react-dom'] = path.resolve(
      'node_modules/react-dom',
    );
  } else {
    (config.resolve!.alias as Alias)['react-dom'] = path.resolve(
      __dirname,
      '../../../../../',
      'node_modules',
      'react-dom',
    );
  }

  config.resolve!.fallback = {
    path: require.resolve('path-browserify'),
  };
  return config;
}

export async function runWebpack(config: Configuration) {
  await new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats?.hasErrors()) {
        reject(stats?.compilation.errors);
      } else {
        resolve(stats);
      }
    });
  });
}
