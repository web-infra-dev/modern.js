import path from 'path';
import { fs } from '@modern-js/utils';
import {
  getModernDeps,
  getVersion,
  validateDepsVerison,
  updateModernVersion,
  handleNpmrc,
  handleHuskyV8,
} from '../src/utils';

describe('upgarde utils', () => {
  it('getVersion', async () => {
    const res = await getVersion('@modern-js/app-tools', '2.48.0');
    expect(res).toBe('2.48.0');
  });

  it('getModernDeps', () => {
    const res = getModernDeps({
      devDependencies: {
        '@modern-js/plugin-storybook': '1.0.0',
        '@modern-js/app-tools': '1.1.0',
        '@modern-js-reduck/core': '1.0.0',
        '@modern-js/electron': '1.0.0',
        '@modern-js/codesmith': '1.0.0',
        '@modern-js/codesmith-api': '1.0.0',
        '@modern-js-app/xxx': '1.2.3',
        react: '18',
      },
      dependencies: {
        '@modern-js/plugin-aaa': '1.1.0',
      },
    });
    expect(res).toEqual({
      '@modern-js/app-tools': '1.1.0',
      '@modern-js/plugin-aaa': '1.1.0',
      '@modern-js-app/xxx': '1.2.3',
    });

    // none
    expect(getModernDeps({})).toEqual({});
  });

  it('validateDepsVerison', () => {
    // false
    expect(
      validateDepsVerison(
        {
          '@modern-js/app-tools': '1.1.0',
          aaa: '1.1.0',
        },
        '1.1.0',
      ),
    ).toBe(true);

    // true
    expect(
      validateDepsVerison(
        {
          '@modern-js/app-tools': '1.1.0',
          aaa: '0.0.1',
        },
        '1.1.0',
      ),
    ).toBe(false);

    // empty object
    expect(validateDepsVerison({}, '1.0.0')).toBe(false);
  });

  it('updateModernVersion update version right', () => {
    const obj = {
      devDependencies: {
        '@modern-js/app-tools': '2.1.0',
        '@modern-js/plugin-aaa': '2.1.0',
      },
      dependencies: {
        '@modern-js/plugin-bbb': '2.1.0',
      },
    };

    expect(updateModernVersion(obj, '2.48.0')).toEqual({
      devDependencies: {
        '@modern-js/app-tools': '2.48.0',
        '@modern-js/plugin-aaa': '2.48.0',
      },
      dependencies: {
        '@modern-js/plugin-bbb': '2.48.0',
      },
    });
  });

  it('updateModernVersion when package.json is empty', () => {
    const obj2 = {};
    expect(updateModernVersion(obj2, '2.48.0')).toEqual({});
  });

  it('updateModernVersion when has dep to exclude', () => {
    // deps exclude eg plugin-storybook
    const obj3 = {
      devDependencies: {
        '@modern-js/plugin-storybook': '100',
        '@modern-js/app-tools': '2.0.0',
      },
    };

    const res = updateModernVersion(obj3, '2.48.0');
    expect(res.devDependencies['@modern-js/plugin-storybook']).toEqual('100');
    expect(res.devDependencies['@modern-js/app-tools']).toEqual('2.48.0');
  });

  it('handleNpmrc should append content to .npmrc', () => {
    const rootPath = '/path/to/root';
    const npmrcPath = path.join(rootPath, '.npmrc');

    // Mock fs.existsSync to return true
    fs.existsSync = jest.fn().mockReturnValue(true);

    // Mock fs.readFileSync to return a content that does not include 'strict-peer-dependencies=false'
    fs.readFileSync = jest.fn().mockReturnValue('some content');

    // Mock fs.appendFileSync
    fs.appendFileSync = jest.fn();

    handleNpmrc(rootPath);

    // Assertions
    expect(fs.existsSync).toBeCalledWith(npmrcPath);
    expect(fs.readFileSync).toBeCalledWith(npmrcPath, 'utf-8');
    expect(fs.appendFileSync).toBeCalledWith(
      npmrcPath,
      '\nstrict-peer-dependencies=false\n',
    );
  });

  it('handleNpmrc should create .npmrc with strict-peer-dependencies=false if .npmrc does not exist', () => {
    const rootPath = '/path/to/root';
    const npmrcPath = path.join(rootPath, '.npmrc');

    // Mock fs.existsSync to return false
    fs.existsSync = jest.fn().mockReturnValue(false);

    // Mock fs.ensureFileSync and fs.writeFileSync
    fs.ensureFileSync = jest.fn();
    fs.writeFileSync = jest.fn();

    handleNpmrc(rootPath);

    // Assertions
    expect(fs.existsSync).toBeCalledWith(npmrcPath);
    expect(fs.ensureFileSync).toBeCalledWith(npmrcPath);
    expect(fs.writeFileSync).toBeCalledWith(
      npmrcPath,
      'strict-peer-dependencies=false',
    );
  });

  it('handleHuskyV8: should update husky version and prepare script if needed', () => {
    const rootPath = '/path/to/root';
    const pkgJson = {
      devDependencies: {
        husky: '7.1.0',
      },
      scripts: {
        prepare: 'some prepare script',
      },
      husky: 'hhhh',
    };

    fs.ensureDirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.chmodSync = jest.fn();

    handleHuskyV8(rootPath, pkgJson);

    expect(fs.ensureDirSync).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(fs.readFileSync).toBeCalled();
    expect(fs.chmodSync).toBeCalled();

    expect(pkgJson.devDependencies.husky).toBe('^8.0.0');
    expect(pkgJson.scripts.prepare).toBe(
      'some prepare script && husky install',
    );
    expect(pkgJson.husky).toBeUndefined();
  });

  it('handleHuskyV8: should not update husky if not needed', () => {
    const rootPath = '/path/to/root';
    const pkgJson = {
      devDependencies: {
        husky: '^8.0.0',
      },
      scripts: {
        prepare: 'some prepare script && husky install',
      },
    };

    fs.ensureDirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.chmodSync = jest.fn();

    handleHuskyV8(rootPath, pkgJson);

    expect(fs.ensureDirSync).not.toBeCalled();
    expect(fs.writeFileSync).not.toBeCalled();
    expect(fs.readFileSync).not.toBeCalled();
    expect(fs.chmodSync).not.toBeCalled();
    expect(pkgJson.devDependencies.husky).toBe('^8.0.0');
  });
});
