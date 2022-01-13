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
    testOperator.mergeJestConfig({
      transform: {
        '\\.[jt]sx?$': require.resolve('ts-jest'),
      },
    });

    const compilerOptions = resolveTsCompilerOptions();

    compilerOptions &&
      testOperator.mergeJestConfig({
        globals: {
          'ts-jest': {
            tsconfig: compilerOptions,
          },
        },
      });
  }
};
