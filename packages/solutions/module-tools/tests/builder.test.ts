import path from 'path';
import { checkSwcHelpers } from '../src/utils';
import { removeTscLogTime } from '../src/builder/dts/tsc';

describe('utils: builder', () => {
  it('checkSwcHelpers', async () => {
    const appDirectory = path.join(__dirname, '../fixtures/utils/builder');
    let test1HappenError = false;
    try {
      await checkSwcHelpers({ appDirectory, externalHelpers: true });
    } catch (err) {
      test1HappenError = true;
    }
    expect(test1HappenError).toBeTruthy();

    let test2HappenError = false;
    try {
      await checkSwcHelpers({
        appDirectory,
        externalHelpers: false,
      });
    } catch (err) {
      test2HappenError = true;
    }
    expect(test2HappenError).toBeFalsy();
  });
});

describe('utils: removeTscLogTime', () => {
  it('should remove time from tsc logs correctly', () => {
    expect(
      removeTscLogTime(
        '[\x1B[90m7:28:23 PM\x1B[0m] Starting compilation in watch mode...',
      ),
    ).toEqual('Starting compilation in watch mode...');

    expect(
      removeTscLogTime(
        '[\x1B[90m7:28:24 PM\x1B[0m] Found 0 errors. Watching for file changes.',
      ),
    ).toEqual('Found 0 errors. Watching for file changes.');
  });
});
