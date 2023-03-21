import { CheckSyntaxExclude } from './type';

export function checkIsExcludeSource(
  path: string,
  exclude?: CheckSyntaxExclude,
) {
  if (!exclude) {
    return false;
  }

  const excludes = Array.isArray(exclude) ? exclude : [exclude];

  return excludes.some(reg => reg.test(path));
}
