import { readCompilerOptions } from '../../utils';
import { TestConfigOperator } from '../testConfigOperator';

const resolveTsCompilerOptions = () => {
  const tsCompilerOptions = readCompilerOptions() || {};

  const { jsx } = tsCompilerOptions;

  if (!jsx) {
    return null;
  }

  tsCompilerOptions.jsx = 'react-jsx';

  return tsCompilerOptions;
};

/**
 * Map `TestConfig.transformer` to jest config
 */
export const patchTransformer = (testOperator: TestConfigOperator) => {
  const { transformer } = testOperator.testConfig;

  if (transformer === 'babel-jest') {
    testOperator.mergeJestConfig({
      transform: {
        '\\.[jt]sx?$': require.resolve('../transformer/babelTransformer'),
      },
    });
  }

  if (transformer === 'ts-jest') {
    const compilerOptions = resolveTsCompilerOptions();
    testOperator.mergeJestConfig({
      transform: {
        '\\.[jt]sx?$': [require.resolve('ts-jest'), compilerOptions || {}],
      },
    });
  }
};
