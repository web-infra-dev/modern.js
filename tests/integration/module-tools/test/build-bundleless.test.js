const path = require('path');
const { fs } = require('@modern-js/utils');
const {
  clearBuildDist,
  modernBuild,
} = require('../../../utils/modernTestUtils');
const { getFolderList, getFilesList } = require('./utils');

const projectPath = path.resolve(
  __dirname,
  '../fixtures/build-config-bundleless',
);
const projectDistPath = path.join(projectPath, 'dist');

describe('bundlelessOptions', () => {
  beforeEach(() => {
    clearBuildDist(projectPath);
  });

  test(`when sourceDir = 'src' | 'src1'`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config.js',
    ]);
    expect(ret.code).toBe(0);

    const files = await getFilesList(`${projectDistPath}`);
    expect(files.length).toBe(2);
    expect(files.some(f => f.includes('dist/0'))).toBeTruthy();
    expect(files.some(f => f.includes('dist/1'))).toBeTruthy();
    for (const f of files) {
      if (f.includes('dist/0')) {
        const content = await fs.readFile(f, 'utf-8');
        expect(content.includes('mergeWith')).toBeTruthy();
      } else if (f.includes('dist/1')) {
        const content = await fs.readFile(f, 'utf-8');
        expect(content.includes('template')).toBeTruthy();
      }
    }
  });

  test(`style options`, async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config1.js',
    ]);
    expect(ret.code).toBe(0);

    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    expect(folders.length).toBe(4);
    expect(folders.some(f => f.includes('dist/style0'))).toBeTruthy();
    expect(folders.some(f => f.includes('dist/style1'))).toBeTruthy();
    expect(folders.some(f => f.includes('dist/style2'))).toBeTruthy();
    expect(folders.some(f => f.includes('dist/style3'))).toBeTruthy();

    for (const fd of folders) {
      if (fd.includes('dist/style0')) {
        const files = await getFilesList(fd);
        expect(files.length).toBe(2);
      } else if (fd.includes('dist/style1')) {
        const files = await getFilesList(fd);
        expect(files.length).toBe(2);
      } else if (fd.includes('dist/style2')) {
        const files = await getFilesList(fd);
        expect(files.length).toBe(1);
        expect(files[0].endsWith('.css')).toBeTruthy();
      } else if (fd.includes('dist/style3')) {
        const files = await getFilesList(fd);
        expect(files.length).toBe(1);
        expect(files[0].endsWith('.less')).toBeTruthy();
      }
    }
  });

  test('static option', async () => {
    const ret = await modernBuild(projectPath, [
      '--config',
      './configs/config2.js',
    ]);
    expect(ret.code).toBe(0);

    const folders = await getFolderList(`${projectDistPath}`, { deep: 1 });
    const files = await getFilesList(`${projectDistPath}`);
    expect(folders.length).toBe(1);
    expect(files.length).toBe(1);
    expect(folders[0].includes('dist/static0')).toBeTruthy();
    expect(files[0].includes('dist/static0/readme.md')).toBeTruthy();
  });
});
