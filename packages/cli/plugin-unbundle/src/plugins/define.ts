import type { NormalizedConfig } from '@modern-js/core';
import MagicString from 'magic-string';
import { Plugin as RollupPlugin } from 'rollup';

export const definePlugin = (config: NormalizedConfig): RollupPlugin => {
  const {
    source: { envVars },
  } = config;

  const replacements: Record<string, string> = {};

  // replace process.env.xxx
  for (const key of [
    ...loadClientEnv(),
    ...(envVars || []),
    ...[`NODE_ENV`, 'BUILD_MODE'],
  ]) {
    replacements[`process.env.${key}`] = JSON.stringify(process.env[key]);
  }

  const pattern = new RegExp(
    `\\b(${Object.keys(replacements)
      .map(str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'))
      .join('|')})\\b`,
    'g',
  );

  return {
    name: 'esm-define',
    transform(code, id) {
      if (
        !code ||
        !Object.keys(replacements).length ||
        id.includes('node_modules')
      ) {
        return code;
      }

      const s = new MagicString(code);
      let hasReplaced = false;
      let match;

      while ((match = pattern.exec(code))) {
        hasReplaced = true;
        const start = match.index;
        const end = start + match[0].length;
        const replacement = `${replacements[match[1]]}`;
        s.overwrite(start, end, replacement);
      }

      if (!hasReplaced) {
        return null;
      }

      const result = { code: (s as any).toString() };
      return result;
    },
  };
};

// get env form process.env
export const loadClientEnv = (prefix = 'REACT_APP_') =>
  Object.keys(process.env).filter(key => key.startsWith(prefix));
