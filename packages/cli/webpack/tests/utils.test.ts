import { createBabelChain } from '@modern-js/babel-preset-app';
import { mergeRegex } from '../src/utils/mergeRegex';
import { getBabelOptions } from '../src/utils/getBabelOptions';
import { verifyTsConfigPaths } from '../src/utils/getWebpackAliases';
import { isNodeModulesCss } from '../src/config/shared';
import { getSourceIncludes } from '../src/utils/getSourceIncludes';
import { setPathSerializer } from './util';

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
    const { options: babelOptions } = getBabelOptions(
      'metaName',
      '/root',
      {} as any,
      createBabelChain(),
      {
        target: 'client',
      },
    );

    setPathSerializer();
    expect(babelOptions).toMatchSnapshot();
  });
});

describe('verifyTsConfigPaths', () => {
  expect(() => {
    verifyTsConfigPaths('/', { source: { alias: { foo: 'bar' } } });
  }).toThrowError();
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

describe('get source includes', () => {
  it('should format non-absolute path to RegExp', () => {
    expect(
      getSourceIncludes('/root', {
        source: { include: ['foo'] },
      } as any),
    ).toEqual([/foo/]);
  });

  it('should allow to use RegExp include', () => {
    expect(
      getSourceIncludes('/root', {
        source: { include: [/foo/] },
      } as any),
    ).toEqual([/foo/]);
  });

  it('should allow to use absolute path include', () => {
    expect(
      getSourceIncludes('/root', {
        source: { include: ['/foo/bar'] },
      } as any),
    ).toEqual(['/foo/bar']);
  });
});
