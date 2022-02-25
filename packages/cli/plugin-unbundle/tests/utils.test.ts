import * as path from 'path';
import { shouldUseBff, hasBffPlugin } from '../src/utils';

describe('utils', () => {
  test('should use bff correctly', () => {
    const appDirectory1 = path.join(__dirname, './fixtures/tailwind-example');
    expect(hasBffPlugin(appDirectory1)).toBe(false);

    const appDirectory2 = path.join(__dirname, './fixtures/scan-imports');
    expect(hasBffPlugin(appDirectory2)).toBe(true);
    expect(shouldUseBff(appDirectory2)).toBe(false);
  });
});
