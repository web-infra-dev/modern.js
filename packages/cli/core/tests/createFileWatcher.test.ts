import * as path from 'path';
import { fs, wait } from '@modern-js/utils';
import { createFileWatcher } from '../src/utils';
import { IAppContext } from '../src';

const mockAppDirectory = path.join(__dirname, './fixtures/index-test');
const mockSrcDirectory = path.join(mockAppDirectory, './src');

describe('createFileWatcher', () => {
  const argv = process.argv.slice(0);

  beforeEach(() => {
    // mock dev command
    process.argv[2] = 'dev';
  });

  afterAll(() => {
    const file = path.join(mockSrcDirectory, './index.ts');
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    process.argv = argv;
  });

  it('will trigger add event', async () => {
    let triggeredType = '';
    let triggeredFile = '';
    const appContext: IAppContext = {
      appDirectory: '',
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
