import * as path from 'path';
import { wait } from '@modern-js/utils';
import { createFileWatcher } from '../src/utils';
import { IAppContext } from '../src';

const mockAppDirectory = path.join(__dirname, './fixtures/index-test');

describe('createFileWatcher', () => {
  const argv = process.argv.slice(0);

  beforeEach(() => {
    // mock dev command
    process.argv[2] = 'dev';
  });

  afterAll(() => {
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
      watchFiles: async () => [mockAppDirectory],
      fileChange: jest.fn(({ filename, eventType }) => {
        triggeredType = eventType;
        triggeredFile = filename;
      }),
    };

    const watcher = await createFileWatcher(
      appContext as any,
      hooksRunner as any,
    );
    await wait(100);

    // Add a file
    const file = path.join(mockAppDirectory, './package.json');
    watcher?.emit('add', file);
    expect(triggeredType).toBe('add');
    expect(hooksRunner.fileChange).toBeCalledTimes(1);
    expect(file.includes(triggeredFile)).toBeTruthy();

    // Remove a file
    watcher?.emit('unlink', file);
    expect(triggeredType).toBe('unlink');
    expect(hooksRunner.fileChange).toBeCalledTimes(2);
    expect(file.includes(triggeredFile)).toBeTruthy();

    watcher?.close();
  });
});
