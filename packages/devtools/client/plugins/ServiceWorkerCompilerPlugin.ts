import path from 'path';
import { createRsbuild, type Rspack } from '@rsbuild/core';
import { logger } from '@modern-js/utils/logger';
import { version } from '../package.json';

export class ServiceWorkerCompilerPlugin {
  name = 'ServiceWorkerCompilerPlugin';
  apply(compiler: Rspack.Compiler) {
    compiler.hooks.beforeCompile.tapPromise(this.name, async () => {
      const cwd = path.resolve(__dirname, '../');

      const builder = await createRsbuild({
        cwd,
        rsbuildConfig: {
          source: {
            entry: { 'sw-proxy': path.resolve(cwd, './src/service.worker.ts') },
            define: { 'process.env.VERSION': JSON.stringify(version) },
          },
          output: {
            targets: ['service-worker'],
            sourceMap: {
              js: false,
              css: false,
            },
            cleanDistPath: false,
            distPath: {
              root: './dist',
              worker: './public',
            },
          },
          tools: {
            bundlerChain(chain) {
              chain.output.uniqueName('modernjsDevtoolsSW');
              chain.output.delete('libraryTarget');
            },
          },
          dev: { progressBar: false },
        },
      });

      if (compiler.watchMode) {
        logger.info('Build service worker in watch mode.');
        builder.build({ watch: true });
      } else {
        await builder.build();
      }
    });
  }
}
