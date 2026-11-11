import type { Rspack } from '@modern-js/builder';

/** Only compiler-owned non-HTML outputs may bypass application admission. */
export function createDevAssetMatcher(
  fallbackPrefix: () => string | undefined,
) {
  const compilations = new Map<Rspack.Compiler, Rspack.Compilation>();
  const completed = new Map<Rspack.Compiler, Set<string>>();
  const assets = (compilation: Rspack.Compilation) =>
    new Set(compilation.getAssets().map(asset => asset.name));
  const track = (compiler: Rspack.Compiler | Rspack.MultiCompiler) => {
    const compilers = 'compilers' in compiler ? compiler.compilers : [compiler];
    for (const child of compilers) {
      child.hooks.thisCompilation.tap(
        'ModernDevAssetOwnership',
        compilation => {
          compilations.set(child, compilation);
        },
      );
      child.hooks.done.tap('ModernDevAssetOwnership', stats => {
        compilations.set(child, stats.compilation);
        if (!stats.hasErrors()) completed.set(child, assets(stats.compilation));
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
    for (const [compiler, compilation] of compilations) {
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
        compilation.getAsset(filename) ||
        completed.get(compiler)?.has(filename)
      )
        return true;
    }
    return false;
  };
  return { track, isAsset };
}
