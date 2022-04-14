import * as path from 'path';
import { fs, wait } from '@modern-js/utils';
import { initWatcher } from '../src/initWatcher';

jest.useRealTimers();

const mockAppDirectory = path.join(__dirname, './fixtures/index-test');
const mockConfigDir = './config';
const mockSrcDirectory = path.join(mockAppDirectory, './src');

describe('initWatcher', () => {
  afterAll(() => {
    const file = path.join(mockSrcDirectory, './index.ts');
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });

  xtest('will trigger add event', async () => {
    let triggeredType = '';
    let triggeredFile = '';
    const loaded = {
      filePath: '',
      dependencies: [],
    };
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

    const watcher = await initWatcher(
      loaded as any,
      mockAppDirectory,
      mockConfigDir,
      hooksRunner as any,
      ['dev'],
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
