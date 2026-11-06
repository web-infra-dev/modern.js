import type { Rspack } from '@rsbuild/core';
import path from 'node:path';
import fs from 'node:fs';

export const getBridgeSSRRuntimePlugin = (cliDirectory: string) => ({
  name: 'bridgeStream',
  // Both CLI formats inject ESM so the provider and consumer share one context.
  path: path.resolve(
    cliDirectory,
    '../../esm/ssr-runtime/bridgeStreamPlugin.mjs',
  ),
  config: {},
});

const resolveContextModule = (appDirectory: string) => {
  let consumerDirectory = appDirectory;
  try {
    consumerDirectory = path.dirname(
      require.resolve('@modern-js/runtime/package.json', {
        paths: [appDirectory],
      }),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND')
      throw error;
    // Explicit non-React entries can enable MF without installing the runtime.
  }
  const bridgePackage = require.resolve(
    '@module-federation/bridge-react/package.json',
    { paths: [consumerDirectory, __dirname] },
  );
  const { exports } = JSON.parse(fs.readFileSync(bridgePackage, 'utf8'));
  const entry = exports['./ssr'].import;
  return require.resolve(
    path.resolve(
      path.dirname(bridgePackage),
      typeof entry === 'string' ? entry : entry.default,
    ),
  );
};

/** Select producer and consumer server lifecycles only inside a Node build. */
export class BridgeSSRPlugin {
  constructor(
    private readonly metaName = 'modern-js',
    private readonly contextModule?: string,
  ) {}

  apply(compiler: Rspack.Compiler) {
    const target = compiler.options.target;
    const targets = Array.isArray(target) ? target : [target];
    if (
      !targets.some(
        value =>
          typeof value === 'string' && /^(?:async-)?node(?:\d.*)?$/.test(value),
      )
    )
      return;
    const contextModule =
      this.contextModule || resolveContextModule(compiler.context);
    compiler.hooks.normalModuleFactory.tap('ModernBridgeSSRPlugin', factory => {
      factory.hooks.beforeResolve.tap('ModernBridgeSSRPlugin', data => {
        if (!data) return;
        if (
          data.request === '@module-federation/bridge-react/ssr' ||
          (/^\.\/ssr\.(?:[mc]js|(?:es|cjs)\.js)$/.test(data.request) &&
            /[\\/]bridge-react[\\/]dist$/.test(data.context)) ||
          /[\\/]bridge-react[\\/]dist[\\/]ssr\.(?:[mc]js|(?:es|cjs)\.js)$/.test(
            data.request,
          )
        ) {
          // pnpm peer variants and CJS/ESM must share the Host's SSR context.
          // This entry contains no Router, provider or request-global state.
          data.request = contextModule;
        } else if (
          /^@module-federation\/bridge-react\/v(?:18|19)$/.test(data.request)
        ) {
          // An expose's Node artifact uses the stream producer, even when its
          // source names the React-version browser entry. Web builds keep it.
          data.request = '@module-federation/bridge-react/server';
        } else if (
          data.request === `@${this.metaName}/runtime/mf` ||
          data.request === '@modern-js/runtime/mf'
        ) {
          data.request = '@modern-js/runtime/mf/server';
        } else if (
          data.request === `@${this.metaName}/runtime/internal/route-scope` ||
          data.request === '@modern-js/runtime/internal/route-scope'
        ) {
          data.request = '@modern-js/runtime/internal/route-scope/server';
        } else if (
          /[\\/]ssr-runtime[\\/]bridgeStreamPlugin\.(?:mjs|js)$/.test(
            data.request,
          )
        ) {
          data.request = data.request.replace(/\.(mjs|js)$/, '.node.$1');
        }
      });
    });
  }
}
