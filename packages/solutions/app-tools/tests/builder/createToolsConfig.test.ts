import { createBuilderTsChecker } from '../../src/builder/createToolsConfig';

describe('test create Builder TsChecker Config', () => {
  it('should disableTsChecker', () => {
    const output1 = {
      enableTsLoader: true,
    };
    const tsCheckerConfig1 = createBuilderTsChecker(output1);
    expect(tsCheckerConfig1).toBeFalsy();
  });

  it('should return default TsChecker Config', () => {
    const output = {};
    const tsCheckerConfig = createBuilderTsChecker(output);
    expect(tsCheckerConfig).toEqual({
      issue: {
        include: [{ file: '**/src/**/*' }],
        exclude: [
          { file: '**/*.(spec|test).ts' },
          { file: '**/node_modules/**/*' },
        ],
      },
    });
  });
});
