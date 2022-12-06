import { get } from '@modern-js/utils/lodash';

export function requireModule(modulePath: string) {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const module = require(modulePath);
  return get(module, ['default']) || module;
}
