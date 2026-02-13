import fs from 'node:fs/promises';
import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const serverOnlyEmptyPath = path.join(
  path.dirname(require.resolve('server-only')),
  'empty.js',
);
const remoteDistStaticDir = path.resolve(__dirname, '../remote/dist/static');

const copyRemoteExposeAssets = async (subDir: 'js' | 'css') => {
  const remoteAsyncDir = path.join(remoteDistStaticDir, subDir, 'async');
  const hostAsyncDir = path.resolve(__dirname, 'dist/static', subDir, 'async');
  const remoteFiles = await fs.readdir(remoteAsyncDir).catch(() => []);
  if (remoteFiles.length === 0) {
    return;
  }

  await fs.mkdir(hostAsyncDir, { recursive: true });
  await Promise.all(
    remoteFiles
      .filter(file => file.startsWith('__federation_expose_'))
      .map(file =>
        fs.copyFile(
          path.join(remoteAsyncDir, file),
          path.join(hostAsyncDir, file),
        ),
      ),
  );
};

class CopyRemoteExposeAssetsPlugin {
  apply(compiler: any) {
    compiler.hooks.afterEmit.tapPromise(
      'CopyRemoteExposeAssetsPlugin',
      async () => {
        if (compiler.options.mode !== 'production') {
          return;
        }
        await Promise.all([
          copyRemoteExposeAssets('js'),
          copyRemoteExposeAssets('css'),
        ]);
      },
    );
  }
}

export default defineConfig({
  server: {
    rsc: true,
    port: Number(process.env.PORT || 3007),
  },
  // Keep RSC server entries synchronous for MF+RSC handlers.
  source: {
    enableAsyncEntry: false,
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
  },
  performance: {
    buildCache: false,
  },
  tools: {
    bundlerChain(chain) {
      const target = chain.get('target');
      const targets = Array.isArray(target) ? target : [target];
      if (targets.some(item => String(item).includes('node'))) {
        chain.target('async-node');
        chain.resolve.conditionNames
          .clear()
          .add('require')
          .add('import')
          .add('default');
        chain.resolve.alias.set('server-only$', serverOnlyEmptyPath);
      } else {
        chain
          .plugin('rsc-mf-copy-remote-exposes')
          .use(CopyRemoteExposeAssetsPlugin);
      }

      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
