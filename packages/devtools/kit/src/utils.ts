import { ShortenAlias } from './client';

export function applyShortenAliases(
  resource: string,
  aliases?: ShortenAlias[],
) {
  if (!aliases) return resource;
  let ret = resource;
  for (const alias of aliases) {
    ret = ret.replace(alias.replace, alias.to);
  }
  return ret;
}
