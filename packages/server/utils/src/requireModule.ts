import { findExists } from '@modern-js/utils';

const FILE_EXTENSIONS = ['.ts', '.js'];

export const requireModule = (filename: string) => {
  const exist = findExists(FILE_EXTENSIONS.map(ext => `${filename}${ext}`));

  if (!exist) {
    return null;
  }

  // throw errors directly if require fail
  const mod = require(exist);
  return interopRequire(mod);
};

function interopRequire(obj: any) {
  return interopRequireDefault(obj).default;
}

function interopRequireDefault(obj: any) {
  return obj?.__esModule ? obj : { default: obj };
}
