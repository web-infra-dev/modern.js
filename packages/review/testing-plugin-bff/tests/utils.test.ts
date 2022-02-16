import * as path from 'path';
import { isBFFProject, existSrc } from '../src/utils';
import mockAPI from '../src/mockAPI';

describe('testing-plugin-bff utils', () => {
  test('isBFFProject', () => {
    const appDir = path.resolve(__dirname, './fixtures/bff1');
    expect(isBFFProject(appDir)).toBe(true);
    expect(mockAPI).toBeInstanceOf(Function);
  });

  test('existSrc', async () => {
    const appDir1 = path.resolve(__dirname, './fixtures/bff1');
    expect(await existSrc(appDir1)).toBe(false);
    const appDir2 = path.resolve(__dirname, './fixtures/bff2');
    expect(await existSrc(appDir2)).toBe(true);
  });
});
