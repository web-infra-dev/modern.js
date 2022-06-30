/* eslint-disable max-lines */
const path = require('path');
const { fs } = require('@modern-js/utils');
const {
  clearBuildDist,
  modernBuild,
} = require('../../../utils/modernTestUtils');
const { getFolderList, getFilesList, formatFolder } = require('./utils');

describe('nothing config', () => {
  const projectPath = path.resolve(__dirname, '../fixtures/build');
  afterAll(() => {
    clearBuildDist(projectPath);
  });
  it(`should have three dirs`, async () => {
    const ret = await modernBuild(projectPath);
    expect(ret.code).toBe(0);
  });
});

describe('legacy config', () => {
  const projectPath = path.resolve(__dirname, '../fixtures/build-legacy');
  const projectDistPath = path.join(projectPath, 'dist');

  beforeAll(() => {
    clearBuildDist(projectPath);
  });
  it(`packageMode is universal-js`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config1.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(formatFolder(folders, projectPath)).toMatchSnapshot();
  });

  it(`packageMode is universal-js-lite`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config2.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(formatFolder(folders, projectPath)).toMatchSnapshot();
  });

  it(`packageMode is browser-js`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config3.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(formatFolder(folders, projectPath)).toMatchSnapshot();
  });

  it(`packageMode is browser-js-lite`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config4.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(formatFolder(folders, projectPath)).toMatchSnapshot();
  });

  it(`packageMode is node-js`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config5.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(formatFolder(folders, projectPath)).toMatchSnapshot();
  });

  it(`packageField is {
    "main": "CJS+ES6",
    "module": "ESM+ES5",
    "jsnext:modern": "ESM+ES6"
}`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config6.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(formatFolder(folders, projectPath)).toMatchSnapshot();
  });
});

describe('output.buildPreset', () => {
  const projectPath = path.resolve(__dirname, '../fixtures/build-preset');
  const projectDistPath = path.join(projectPath, 'dist');
  beforeEach(() => {
    clearBuildDist(projectPath);
  });
  test(`when buildPreset is npm-component`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config1.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(3);
    expect(folders.some(f => f.includes('es'))).toBe(true);
    expect(folders.some(f => f.includes('lib'))).toBe(true);
    expect(folders.some(f => f.includes('types'))).toBe(true);
  });

  test(`when buildPreset is npm-component-with-umd`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config2.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(4);
    expect(folders.some(f => f.includes('es'))).toBe(true);
    expect(folders.some(f => f.includes('lib'))).toBe(true);
    expect(folders.some(f => f.includes('types'))).toBe(true);
    expect(folders.some(f => f.includes('umd'))).toBe(true);
  });

  test(`when buildPreset is npm-library`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config3.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(folders.length).toBe(3);
    expect(folders.some(f => f.includes('es'))).toBe(true);
    expect(folders.some(f => f.includes('lib'))).toBe(true);
    expect(folders.some(f => f.includes('types'))).toBe(true);
  });

  test(`when buildPreset is npm-library-with-umd`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config4.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 2 });
    expect(folders.length).toBe(4);
    expect(folders.some(f => f.includes('es'))).toBe(true);
    expect(folders.some(f => f.includes('lib'))).toBe(true);
    expect(folders.some(f => f.includes('umd'))).toBe(true);
    expect(folders.some(f => f.includes('types'))).toBe(true);
  });

  it(`should happen error, when buildPreset is custom-preset`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config5.js',
    ]);
    expect(ret.code).toBe(1);
  });
});

describe('output.buildConfig', () => {
  const projectPath = path.resolve(__dirname, '../fixtures/build-config');
  const projectDistPath = path.join(projectPath, 'dist');

  // const snapFiles = async files => {
  //   for (const f of files) {
  //     const ret = await fs.readFile(f, 'utf-8');
  //     expect(ret).toMatchSnapshot(f);
  //   }
  // };

  beforeEach(() => {
    clearBuildDist(projectPath);
  });
  test(`when buildConfig is {}`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config1.js',
    ]);
    expect(ret.code).toBe(0);
    const files = await getFilesList(`${projectDistPath}`, {});
    expect(formatFolder(files, projectPath)).toMatchSnapshot();
  });

  test(`when buildConfig is { buildType: 'bundle' }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config2.js',
    ]);
    expect(ret.code).toBe(0);
    const files = await getFilesList(`${projectDistPath}`);
    expect(files.length).toBe(2);
  });

  test(`when buildConfig is { buildType: 'bundleless' }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config3.js',
    ]);
    expect(ret.code).toBe(0);
    const files = await getFilesList(`${projectDistPath}`);
    expect(files.length).toBe(3);
  });

  test(`when buildConfig is array`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config4.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(3);
  });

  test(`when buildConfig { buildType: 'bundle', format: 'cjs' | 'esm' | 'umd' }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config5.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(3);
    for (const f of folders) {
      const distIndexFile = await fs.readFile(
        path.join(f, 'index.js'),
        'utf-8',
      );
      if (f.includes('cjs')) {
        expect(distIndexFile.includes('__esModule')).toBeTruthy();
      } else if (f.includes('esm')) {
        expect(distIndexFile.includes('import')).toBeTruthy();
      } else if (f.includes('umd')) {
        expect(
          distIndexFile.includes(
            'if (typeof define === "function" && define.amd) {',
          ),
        ).toBeTruthy();
      }
    }
  });

  test(`when buildConfig { buildType: 'bundleless', format: 'cjs' | 'esm' | 'umd' }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config6.js',
    ]);
    expect(ret.code).toBe(0);
    expect(
      ret.stdout.includes('bundleless 构建暂时不支持 umd 格式'),
    ).toBeTruthy();
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(2);
    for (const f of folders) {
      const distIndexFile = await fs.readFile(
        path.join(f, 'index.js'),
        'utf-8',
      );
      if (f.includes('cjs')) {
        expect(distIndexFile.includes('__esModule')).toBeTruthy();
      } else if (f.includes('esm')) {
        expect(distIndexFile.includes('import')).toBeTruthy();
      }
    }
  });

  test(`when buildConfig { buildType: 'bundleless', sourceMap: true | false | external | inline }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config7.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(4);
    for (const f of folders) {
      const distIndexPath = path.join(f, 'index.js');
      const sourceMapPath = path.join(f, 'index.js.map');
      if (f.includes('cjs-sourcemap-true')) {
        expect(await fs.pathExists(sourceMapPath)).toBeTruthy();
      } else if (f.includes('cjs-sourcemap-external')) {
        expect(await fs.pathExists(sourceMapPath)).toBeTruthy();
      } else if (f.includes('cjs-sourcemap-inline')) {
        expect(await fs.pathExists(sourceMapPath)).toBeFalsy();
        const content = await fs.readFile(distIndexPath, 'utf-8');
        expect(
          content.includes(
            'sourceMappingURL=data:application/json;charset=utf-8;base64',
          ),
        ).toBeTruthy();
      } else if (f.includes('cjs-source-false')) {
        expect(await fs.pathExists(sourceMapPath)).toBeFalsy();
        const content = await fs.readFile(distIndexPath, 'utf-8');
        expect(content.includes('inline')).toBeFalsy();
      }
    }
  });

  test(`when buildConfig { buildType: 'bundle', sourceMap: true | false | external | inline }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config8.js',
    ]);
    expect(ret.code).toBe(0);
    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(4);
    for (const f of folders) {
      const distIndexPath = path.join(f, 'index.js');
      const sourceMapPath = path.join(f, 'index.js.map');
      if (f.includes('cjs-sourcemap-true')) {
        expect(await fs.pathExists(sourceMapPath)).toBeTruthy();
      } else if (f.includes('cjs-sourcemap-external')) {
        expect(await fs.pathExists(sourceMapPath)).toBeTruthy();
      } else if (f.includes('cjs-sourcemap-inline')) {
        expect(await fs.pathExists(sourceMapPath)).toBeFalsy();
        const content = await fs.readFile(distIndexPath, 'utf-8');
        expect(
          content.includes(
            'sourceMappingURL=data:application/json;charset=utf-8;base64',
          ),
        ).toBeTruthy();
      } else if (f.includes('cjs-source-false')) {
        expect(await fs.pathExists(sourceMapPath)).toBeFalsy();
        const content = await fs.readFile(distIndexPath, 'utf-8');
        expect(content.includes('inline')).toBeFalsy();
      }
    }
  });

  test(`when buildConfig { buildType: 'bundle' | 'bundleless', enableDts: true | false, dtsOnly: true | false }`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config9.js',
    ]);
    expect(ret.code).toBe(0);

    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(4);
    for (const f of folders) {
      const distIndexPath = path.join(f, 'index.js');
      const distIndexDtsPath = path.join(f, 'index.d.ts');
      if (f.includes('bundle-enable-dts')) {
        expect(await fs.pathExists(distIndexPath)).toBeTruthy();
        expect(await fs.pathExists(distIndexDtsPath)).toBeTruthy();
      } else if (f.includes('bundleless-enable-dts')) {
        expect(await fs.pathExists(distIndexPath)).toBeTruthy();
        expect(await fs.pathExists(distIndexDtsPath)).toBeTruthy();
      } else if (f.includes('bundle-dtsonly-enable-dts')) {
        expect(await fs.pathExists(distIndexPath)).toBeFalsy();
        expect(await fs.pathExists(distIndexDtsPath)).toBeTruthy();
      } else if (f.includes('bundleless-dtsonly-enable-dts')) {
        expect(await fs.pathExists(distIndexPath)).toBeFalsy();
        expect(await fs.pathExists(distIndexDtsPath)).toBeTruthy();
      }
    }
  });
});
/* eslint-enable max-lines */
