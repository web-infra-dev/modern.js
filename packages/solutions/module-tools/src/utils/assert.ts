export function isStyleExt(path: string) {
  return /\.(c|le|sa|sc)ss(\?.*)?$/.test(path);
}

export function isJsExt(path: string) {
  return /\.(m|c)?(j|t)sx?(\?.*)?$/.test(path);
}

export function isJsLoader(loader?: string) {
  return (
    loader === 'js' || loader === 'ts' || loader === 'tsx' || loader === 'jsx'
  );
}

export function isTsExt(path: string) {
  return /\.(m|c)?tsx?(\?.*)?$/.test(path);
}

export function isTsLoader(loader?: string) {
  return loader === 'ts' || loader === 'tsx';
}
