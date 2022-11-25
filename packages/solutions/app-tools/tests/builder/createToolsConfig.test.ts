import { createBuilderTsChecker } from '../../src/builder/createToolsConfig';

describe('test create Builder TsChecker Config', () => {
  it('should return default TsChecker Config', () => {
    const tsCheckerConfig = createBuilderTsChecker();
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
