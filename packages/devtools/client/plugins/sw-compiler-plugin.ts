import path from 'path';
import { createCompiler, Compiler, DefinePlugin } from '@rspack/core';
import { logger } from '@modern-js/utils/logger';
import { version } from '../package.json';

const workspace = path.resolve(__dirname, '../');

export class ServiceWorkerCompilerPlugin {
  name = 'ServiceWorkerCompilerPlugin';
  apply(compiler: Compiler) {
    compiler.hooks.beforeCompile.tapPromise(this.name, async () => {
      const watch = compiler.watchMode ?? false;
      watch && logger.info('Build service worker in watch mode.');

      const childCompiler = createCompiler({
        mode: 'production',
        context: workspace,
        entry: path.resolve(workspace, './src/service.worker.ts'),
        target: 'webworker',
        devtool: false,
        watch,
        output: {
          path: path.resolve(workspace, 'dist/public'),
          filename: 'sw-proxy.js',
        },
        plugins: [
          new DefinePlugin({
            'process.env.VERSION': JSON.stringify(version),
          }),
        ],
      });
      childCompiler.run((e: any) => {
        if (e) {
          logger.error(e);
        } else {
          logger.info('Build service worker successfully.');
        }
      });
    });
  }
}
