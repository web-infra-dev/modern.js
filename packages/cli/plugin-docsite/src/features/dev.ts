import path from 'path';
import { logger } from '@modern-js/utils';
import webpack, { Configuration } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { chokidarFile } from './utils/chokidar';
import { generateFiles } from './utils/generate-files';

export async function dev(
  appDirectory: string,
  tmpDir: string,
  files: string[],
  webpackConfig: Configuration,
  isDev: boolean,
  port: number,
) {
  await generateFiles(appDirectory, tmpDir, files, isDev);
  const compiler = webpack(webpackConfig);
  const server = new WebpackDevServer(
    {
      host: '0.0.0.0',
      port,
      historyApiFallback: true,
      static: {
        directory: path.resolve(appDirectory, 'assets'),
        publicPath: '/assets',
      },
    } as WebpackDevServer.Configuration,
    compiler as any,
  );

  server.startCallback(() => {
    logger.info(`Starting server on http://localhost:${port}`);
  });

  chokidarFile(appDirectory, tmpDir, isDev);
}
