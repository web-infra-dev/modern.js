import { CSS_MODULE_REGEX, CSS_REGEX, NODE_MODULES_REGEX } from './constants';

export async function isFileExists(file: string) {
  const { promises, constants } = await import('fs');
  return promises
    .access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export const isNodeModulesCss = (path: string) =>
  NODE_MODULES_REGEX.test(path) &&
  CSS_REGEX.test(path) &&
  !CSS_MODULE_REGEX.test(path);
