import { TestConfigOperator } from '../testConfigOperator';
import { upath } from '@modern-js/utils';
/**
 * Merge config from testConfig.jest
 */
export const patchAssetsModule = (testOperator: TestConfigOperator) => {
  testOperator.mergeJestConfig({
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': upath.normalizeSafe(require.resolve('identity-obj-proxy')),
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      upath.normalizeSafe(require.resolve('./filemock.js')),
    },
  });
};
