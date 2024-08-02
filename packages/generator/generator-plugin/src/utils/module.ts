import { get } from '@modern-js/utils/lodash';

export function requireModule(modulePath: string) {
  const module = require(modulePath);
  return get(module, ['default']) || module;
}
