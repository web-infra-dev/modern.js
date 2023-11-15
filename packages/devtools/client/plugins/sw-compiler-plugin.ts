import path from 'path';
import { rspack, Compiler } from '@rspack/core';

const workspace = path.resolve(__dirname, '../');

export class ServiceWorkerCompilerPlugin {
  name = 'ServiceWorkerCompilerPlugin';
  apply(compiler: Compiler) {
    compiler.hooks.beforeCompile.tapPromise(this.name, async () => {
      const childCompiler = rspack({
        mode: 'production',
        context: workspace,
        entry: path.resolve(workspace, './src/proxy.worker.js'),
        target: 'webworker',
        devtool: false,
        output: {
          path: path.resolve(workspace, 'dist/public'),
          filename: 'sw-proxy.js',
        },
      });
      return new Promise((resolve, reject) => {
        childCompiler.build(e => {
          e ? reject(e) : resolve(undefined);
        });
      });
    });
  }
}
