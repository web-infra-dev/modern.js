import qs from 'querystring';
export type Query = Record<string, string | boolean>;

interface ResolveResult {
  originalFilePath: string;
  rawQuery?: string;
  query: Query;
}

export const resolvePathAndQuery = (originalPath: string): ResolveResult => {
  const [filePath, queryStr] = originalPath.split('?');
  const query = qs.parse(queryStr ?? '') as Query;

  for (const key of Object.keys(query)) {
    if (query[key] === '') {
      query[key] = true;
    }
  }

  return {
    query,
    rawQuery: queryStr,
    originalFilePath: filePath,
  };
};

export function isStyleExt(path: string) {
  return /\.(c|le|sa|sc)ss(\?.*)?$/.test(path);
}

export function isJsExt(path: string) {
  return /\.(m|c)?(j|t)sx?(\?.*)?$/.test(path);
}

export function isJsLoader(loader?: string) {
  return loader === 'js' || loader === 'ts' || loader === 'tsx' || loader === 'jsx';
}

export function isTsExt(path: string) {
  return /\.(m|c)?tsx?(\?.*)?$/.test(path);
}

export function isTsLoader(loader?: string) {
  return loader === 'ts' || loader === 'tsx';
}
