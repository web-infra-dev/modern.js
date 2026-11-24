import type { Rspack } from '@modern-js/builder';

const HOT_UPDATE_ASSET_RE = /\.hot-update\.(?:json|m?js|css)(?:\.map)?$/i;
const MAX_RETAINED_HOT_UPDATES = 200;

/** Only compiler-owned non-HTML outputs may bypass application admission. */
export function createDevAssetMatcher(
  fallbackPrefix: () => string | undefined,
) {
  const current = new Map<Rspack.Compiler, Set<string>>();
  const completed = new Map<Rspack.Compiler, Set<string>>();
  const hotUpdates = new Map<Rspack.Compiler, Set<string>>();
  const assets = (compilation: Rspack.Compilation) =>
    new Set(compilation.getAssets().map(asset => asset.name));
  const rememberHotUpdates = (
    compiler: Rspack.Compiler,
    names: Set<string>,
  ) => {
    let retained = hotUpdates.get(compiler);
    for (const name of names) {
      if (!HOT_UPDATE_ASSET_RE.test(name)) continue;
      if (!retained) {
        retained = new Set();
        hotUpdates.set(compiler, retained);
      }
      retained.delete(name);
      retained.add(name);
      while (retained.size > MAX_RETAINED_HOT_UPDATES) {
        const oldest = retained.values().next().value;
        if (oldest === undefined) break;
        retained.delete(oldest);
      }
    }
  };
  const track = (compiler: Rspack.Compiler | Rspack.MultiCompiler) => {
    const compilers = 'compilers' in compiler ? compiler.compilers : [compiler];
    for (const child of compilers) {
      child.hooks.thisCompilation.tap(
        'ModernDevAssetOwnership',
        compilation => {
          current.set(child, new Set());
          // Native compilations may be invalidated by the next watch rebuild.
          // Capture plain names inside compilation hooks, never in HTTP handlers.
          compilation.hooks.processAssets.tap(
            { name: 'ModernDevAssetOwnership', stage: Infinity },
            () => {
              const names = assets(compilation);
              current.set(child, names);
              rememberHotUpdates(child, names);
            },
          );
        },
      );
      child.hooks.done.tap('ModernDevAssetOwnership', stats => {
        const names = assets(stats.compilation);
        current.set(child, names);
        rememberHotUpdates(child, names);
        if (!stats.hasErrors()) completed.set(child, names);
      });
    }
  };
  const isAsset = (request: Request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return false;
    }
    for (const [compiler, names] of current) {
      const configured = compiler.options.output?.publicPath;
      const publicPath =
        typeof configured === 'string' && configured !== 'auto'
          ? configured
          : fallbackPrefix() || '/';
      const prefix = new URL(
        publicPath || '/',
        'http://modern.invalid',
      ).pathname.replace(/\/?$/, '/');
      if (!pathname.startsWith(prefix)) continue;
      const filename = pathname.slice(prefix.length);
      if (/\.html?$/i.test(filename)) continue;
      if (
        names.has(filename) ||
        completed.get(compiler)?.has(filename) ||
        hotUpdates.get(compiler)?.has(filename)
      )
        return true;
    }
    return false;
  };
  return { track, isAsset };
}
