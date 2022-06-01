import { memoize } from '../src/utils/memoize';
import { mergeRegex } from '../src/utils/mergeRegex';
import { getBabelOptions } from '../src/utils/getBabelOptions';
import { verifyTsConfigPaths } from '../src/utils/getWebpackAliases';
import { isNodeModulesCss } from '../src/config/shared';

jest.mock('@modern-js/utils', () => {
  const originalModule = jest.requireActual('@modern-js/utils');
  return {
    __esModule: true,
    ...originalModule,
    readTsConfig() {
      return {
        compilerOptions: {
          paths: {
            foo: 'bar',
          },
        },
      };
    },
  };
});

describe('mergeRegex', () => {
  it('should merge regexp correctly', () => {
    expect(mergeRegex(/\.js$/, /\.ts$/)).toEqual(/\.js$|\.ts$/);
  });

  it('should merge string correctly', () => {
    expect(mergeRegex('\\.js$', '\\.ts$')).toEqual(/\.js$|\.ts$/);
  });
});

describe('getBabelOptions', () => {
  it('should return babel options as expected', () => {
    const babelOptions = getBabelOptions(
      'metaName',
      '/root',
      {} as any,
      {} as any,
    );

    // mock dynamic preset name
    babelOptions.presets[0][0] = 'preset-name';

    expect(babelOptions).toEqual({
      babelrc: false,
      compact: false,
      configFile: false,
      presets: [
        [
          'preset-name',
          {
            appDirectory: '/root',
            chain: {},
            lodash: { id: ['lodash', 'ramda'] },
            metaName: 'metaName',
            styledComponents: {
              displayName: true,
              pure: true,
              ssr: false,
              transpileTemplateLiterals: true,
            },
            target: 'client',
            useBuiltIns: undefined,
            useLegacyDecorators: true,
            userBabelConfig: undefined,
          },
        ],
      ],
    });
  });
});

describe('memoize', () => {
  it('should return correct result', () => {
    const double = (a: number) => a * 2;
    const memoizeDouble = memoize(double);
    expect(memoizeDouble(1)).toEqual(2);
    expect(memoizeDouble(2)).toEqual(4);
    expect(memoizeDouble(1)).toEqual(2);
  });

  describe('verifyTsConfigPaths', () => {
    expect(() => {
      verifyTsConfigPaths('/', { source: { alias: { foo: 'bar' } } });
    }).toThrowError();
  });
});

describe('css rule utils', () => {
  it('should test `.css` file in node_modules correctly', () => {
    expect(isNodeModulesCss('node_modules/foo/bar.css')).toEqual(true);
    expect(isNodeModulesCss('node_modules/foo/bar.module.css')).toEqual(false);
    expect(isNodeModulesCss('node_module/foo/bar.css')).toEqual(false);
    expect(isNodeModulesCss('src/foo/bar.css')).toEqual(false);
    expect(isNodeModulesCss('src/foo/bar.module.css')).toEqual(false);
    expect(isNodeModulesCss('node_modules/foo/bar.js')).toEqual(false);
    expect(isNodeModulesCss('node_modules/foo/bar.less')).toEqual(false);
    expect(isNodeModulesCss('node_modules/foo/bar.scss')).toEqual(false);
  });
});
