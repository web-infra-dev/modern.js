import * as path from 'path';
import { logger } from '@modern-js/utils';
import { compiler } from '../src';
import {
  sourceDirAndFileNamesValidMessage,
  watchDirValidMessage,
} from '../src/validate';

const projectDir = path.join(__dirname, './fixtures/lib');
const srcDir = path.join(projectDir, 'src');
const distDir = path.join(projectDir, 'dist');

const originalLogInfo = logger.info;
const originalLogError = logger.error;

describe('babel compiler', () => {
  let testLogs: any[] = [];
  const mockedLogInfo = (s: string | number | Error | undefined) =>
    testLogs.push(s);
  beforeEach(() => {
    logger.info = mockedLogInfo;
    logger.error = mockedLogInfo;
  });

  it('normal compiler', async () => {
    const ret = await compiler(
      {
        rootDir: srcDir,
        filenames: [path.join(srcDir, 'index.js')],
        distDir,
        enableVirtualDist: true,
      },
      {},
    );

    expect(ret.code).toBe(0);
    expect(ret.virtualDists?.length).toBe(1);
  });

  it('compiler with valid', async () => {
    const ret = await compiler(
      {
        rootDir: srcDir,
        distDir,
        enableVirtualDist: true,
      },
      {},
    );

    expect(ret.code).toBe(1);
    expect(ret.message).toBe(sourceDirAndFileNamesValidMessage);

    const ret_1 = await compiler(
      {
        rootDir: srcDir,
        distDir,
        filenames: [path.join(srcDir, 'index.js')],
        enableWatch: true,
        enableVirtualDist: true,
      },
      {},
    );

    expect((ret_1 as any).code).toBe(1);
    expect((ret_1 as any).message).toBe(watchDirValidMessage);
  });

  it('compiler in watch mode', async () => {
    const emitter = await compiler(
      {
        rootDir: srcDir,
        filenames: [path.join(srcDir, 'index.js')],
        distDir,
        enableWatch: true,
        watchDir: srcDir,
        enableVirtualDist: true,
      },
      {},
    );

    expect('on' in emitter).toBe(true);
  });

  afterEach(() => {
    logger.info = originalLogInfo;
    logger.error = originalLogError;
    testLogs = [];
  });
});
