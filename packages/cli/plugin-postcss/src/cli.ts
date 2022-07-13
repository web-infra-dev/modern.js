import type { CliPlugin } from '@modern-js/core';
import {
  modulePostcssConfig,
  getModulePostcssCompiler,
} from './module-postcss-config';

const SASS_REGEX = /\.s(a|c)ss$/;
const SASS_MODULE_REGEX = /\.module\.s(a|c)ss$/;
const NODE_MODULES_REGEX = /node_modules/;

export const isNodeModulesSass = (path: string) =>
  NODE_MODULES_REGEX.test(path) &&
  SASS_REGEX.test(path) &&
  !SASS_MODULE_REGEX.test(path);

export default (): CliPlugin => ({
  name: '@modern-js/plugin-postcss',

  setup: () => ({
    validateSchema: () => {
      return [];
    },
    modulePostcssConfig,
    getModulePostcssCompiler,
  }),
});
