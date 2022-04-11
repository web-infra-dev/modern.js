import * as path from 'path';
import { fs, glob, logger } from '@modern-js/utils';
import { build } from '../src/build';

const projectDir = path.join(__dirname, './fixtures/build');
const srcDir = path.join(projectDir, 'src');
const distDir = path.join(projectDir, 'dist');

const originalLogInfo = logger.info;
const originalLogError = logger.error;

describe('test build', () => {
  let testLogs: any[] = [];
  const mockedLogInfo = (s: string | number | Error | undefined) =>
    testLogs.push(s);
  beforeEach(() => {
    logger.info = mockedLogInfo;
    logger.error = mockedLogInfo;
  });

  it('normal build and success', async () => {
    const filenames = [path.join(srcDir, './index.js')];
    await build({ rootDir: srcDir, filenames, distDir });
    const globFindFiles = glob.sync(`${distDir}/**/*.js`);
    expect(globFindFiles.length).toBe(1);
  });

  it('build with enableVirtualDist and success', async () => {
    const filenames = [path.join(srcDir, './index.js')];
    const ret_1 = await build({
      rootDir: srcDir,
      filenames,
      distDir,
    });
    expect(ret_1.code).toBe(0);
    expect(ret_1.message.includes('Successfully compiled')).toBe(true);
    expect(ret_1.virtualDists?.length).toBe(0);

    const ret = await build({
      rootDir: srcDir,
      filenames,
      distDir,
      enableVirtualDist: true,
    });

    expect(ret.code).toBe(0);
    expect(ret.virtualDists?.length).toBe(1);
  });

  it('build with quiet and success', async () => {
    const filenames = [path.join(srcDir, './index.js')];
    await build({
      rootDir: srcDir,
      filenames,
      distDir,
    });
    expect(testLogs.length).toBe(1);
    testLogs = [];

    await build({
      rootDir: srcDir,
      filenames,
      distDir,
      quiet: true,
    });
    expect(testLogs.length).toBe(0);
  });

  it('build with clean and success', async () => {
    fs.ensureFileSync(path.join(distDir, './test1.js'));
    fs.ensureFileSync(path.join(distDir, './test2.js'));
    const filenames = [path.join(srcDir, './index.js')];
    await build({
      rootDir: srcDir,
      filenames,
      distDir,
      clean: true,
    });
    const globFindFiles = glob.sync(`${distDir}/**/*.js`);
    expect(globFindFiles.length).toBe(1);
  });

  it('build multiple files and success', async () => {
    const filenames = [
      path.join(srcDir, './index.js'),
      path.join(srcDir, './far.js'),
    ];
    const ret = await build({ rootDir: srcDir, filenames, distDir });
    expect(ret.code).toBe(0);
    expect(ret.message.includes('files')).toBe(true);
    expect((testLogs[0] as string).includes('files')).toBe(true);
  });

  it('build and fail', async () => {
    const filenames = [path.join(srcDir, './error')];
    const ret = await build({ rootDir: srcDir, filenames, distDir });
    expect(ret.code).toBe(1);
    expect(ret.messageDetails?.length).toBe(1);
    expect(ret.message.includes('Compilation failure')).toBe(true);
    expect(testLogs.length).toBe(1);
    expect((testLogs[0] as string).includes('Compilation failure')).toBe(true);
  });

  it('build multiple files and fail', async () => {
    const filenames = [
      path.join(srcDir, './error'),
      path.join(srcDir, './error1'),
    ];
    const ret = await build({ rootDir: srcDir, filenames, distDir });
    expect(ret.code).toBe(1);
    expect(ret.message.includes('files')).toBe(true);
    expect((testLogs[0] as string).includes('files')).toBe(true);
  });

  afterEach(() => {
    logger.info = originalLogInfo;
    logger.error = originalLogError;
    testLogs = [];
    fs.removeSync(distDir);
  });
});
