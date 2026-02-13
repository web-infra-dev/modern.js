import fs from 'node:fs/promises';
import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const serverOnlyEmptyPath = path.join(
  path.dirname(require.resolve('server-only')),
  'empty.js',
);
const remoteDistStaticDir = path.resolve(__dirname, '../remote/dist/static');
const REMOTE_COUNTER_ALIAS_MODULES = [
  'remote-module:rscRemote:./src/components/RemoteClientCounter.tsx',
  'remote-module:rscRemote:./RemoteClientCounter',
  'remote-module:rscRemote:./RemoteClientCounter.tsx',
];
const createRemoteNestedMixedAliasChunk = (remoteCounterModuleId: string) =>
  `\n;(globalThis["chunk_rscHost"] = globalThis["chunk_rscHost"] || []).push([["__federation_expose_RemoteNestedMixed_alias"],{${REMOTE_COUNTER_ALIAS_MODULES.map(
    aliasModule =>
      `"${aliasModule}":function(module,__unused,__webpack_require__){module.exports=__webpack_require__(${JSON.stringify(
        remoteCounterModuleId,
      )});}`,
  ).join(',')}}]);`;

const resolveRemoteCounterModuleId = (chunkText: string) => {
  const marker = 'remote-client-server-count';
  const markerIndex = chunkText.indexOf(marker);
  if (markerIndex < 0) {
    return './src/components/RemoteClientCounter.tsx';
  }

  const prefix = chunkText.slice(0, markerIndex);
  const moduleMatches = [
    ...prefix.matchAll(/(\d+)\(e,[^)]*\)\{/g),
  ] as RegExpMatchArray[];
  const moduleId = moduleMatches[moduleMatches.length - 1]?.[1];
  return moduleId || './src/components/RemoteClientCounter.tsx';
};

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
      .map(async file => {
        const sourceFile = path.join(remoteAsyncDir, file);
        const targetFile = path.join(hostAsyncDir, file);
        const shouldPatchNestedMixedChunk =
          subDir === 'js' &&
          file.startsWith('__federation_expose_RemoteNestedMixed') &&
          file.endsWith('.js');

        if (!shouldPatchNestedMixedChunk) {
          await fs.copyFile(sourceFile, targetFile);
          return;
        }

        const chunkText = await fs.readFile(sourceFile, 'utf-8');
        const remoteCounterModuleId = resolveRemoteCounterModuleId(chunkText);
        await fs.writeFile(
          targetFile,
          `${chunkText}${createRemoteNestedMixedAliasChunk(
            remoteCounterModuleId,
          )}`,
          'utf-8',
        );
      }),
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
