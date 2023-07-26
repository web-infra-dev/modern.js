import path from 'path';
import { checkSwcHelpers } from '../src/utils/builder';

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
