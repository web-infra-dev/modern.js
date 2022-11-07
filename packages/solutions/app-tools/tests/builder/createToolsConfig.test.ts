import type { BuilderTarget } from '@modern-js/builder-shared';
import {
  createBuilderTsChecker,
  builderTargetToModernBundleName,
} from '../../src/builder/createToolsConfig';

describe('test create Builder TsChecker Config', () => {
  it('should disableTsChecker', () => {
    const output1 = {
      enableTsLoader: true,
    };
    const tsCheckerConfig1 = createBuilderTsChecker(output1);
    expect(tsCheckerConfig1).toBeFalsy();

    const output2 = {
      disableTsChecker: true,
    };
    const tsCheckerConfig2 = createBuilderTsChecker(output2);
    expect(tsCheckerConfig2).toBeFalsy();
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

// TODO: other test

describe('test builderTargetToModernBundleName', () => {
  it('should transform success', () => {
    const targets: BuilderTarget[] = ['web', 'node', 'modern-web'];
    const expect_names = ['client', 'server', 'modern'];
    const names = targets.map(target =>
      builderTargetToModernBundleName(target),
    );
    expect(names).toEqual(expect_names);
  });

  it('should throw a error', () => {
    const target: BuilderTarget = 'web-worker';
    expect(() => {
      builderTargetToModernBundleName(target);
    }).toThrow(new RegExp(target));
  });
});
