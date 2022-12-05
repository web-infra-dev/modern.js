import * as path from 'path';
import { fs, wait } from '@modern-js/utils';
import type { IAppContext } from '@modern-js/core';
import { DEFAULT_SERVER_CONFIG } from '@modern-js/utils/constants';
import {
  addServerConfigToDeps,
  createFileWatcher,
} from '../../src/utils/createFileWatcher';

jest.useRealTimers();

const mockAppDirectory = path.join(__dirname, './fixtures/index-test');
const mockConfigDir = './config';
const mockSrcDirectory = path.join(mockAppDirectory, './src');

describe('createFileWatcher', () => {
  afterAll(() => {
    const file = path.join(mockSrcDirectory, './index.ts');
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });

  xtest('will trigger add event', async () => {
    let triggeredType = '';
    let triggeredFile = '';
    const appContext: IAppContext = {
      distDirectory: '',
      packageName: '',
      serverConfigFile: '',
      configFile: '',
    } as IAppContext;
    const hooksRunner = {
      watchFiles: async () => [mockSrcDirectory],
      fileChange: jest.fn(({ filename, eventType }) => {
        triggeredType = eventType;
        triggeredFile = filename;
      }),
    };

    if (await fs.pathExists(mockSrcDirectory)) {
      await fs.remove(mockSrcDirectory);
    }

    const watcher = await createFileWatcher(
      appContext as any,
      mockConfigDir,
      hooksRunner as any,
    );
    await wait(100);

    const file = path.join(mockSrcDirectory, './index.ts');
    await fs.outputFile(file, '');
    await wait(100);
    // expect(hooksRunner.fileChange).toBeCalledTimes(1);
    // expect(triggeredType).toBe('add');
    expect(file.includes(triggeredFile)).toBeTruthy();

    await wait(100);
    await fs.remove(file);
    await wait(200);
    expect(hooksRunner.fileChange).toBeCalledTimes(2);
    expect(triggeredType).toBe('unlink');
    expect(file.includes(triggeredFile)).toBeTruthy();

    watcher?.close();
  });
});

describe('addServerConfigToDeps', () => {
  it('should add server config to deps', async () => {
    const appDirectory = path.join(__dirname, '../fixtures/utils');
    const deps: string[] = [];
    await addServerConfigToDeps(deps, appDirectory, DEFAULT_SERVER_CONFIG);
    expect(deps.length).toBe(1);
    expect(deps[0]).toBe(
      path.join(appDirectory, `${DEFAULT_SERVER_CONFIG}.js`),
    );
  });
});
