import { ReplaceRule } from '@/shared/types';

export function applyReplaceRules(
  code = '',
  replaceRules: ReplaceRule[] = [],
): string {
  let result = code;
  for (const rule of replaceRules) {
    result = result.replace(rule.search, rule.replace);
  }
  return result;
}
