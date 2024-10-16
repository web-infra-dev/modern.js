import { get } from '@modern-js/codesmith-utils/lodash';

export function requireModule(modulePath: string) {
  const module = require(modulePath);
  return get(module, ['default']) || module;
}
