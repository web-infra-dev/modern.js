import * as path from 'path';
import { isBFFProject } from '../src/utils';
import mockAPI from '../src/mockAPI';

describe('testing-plugin-bff utils', () => {
  test('isBFFProject', () => {
    const appDir = path.resolve(__dirname, './fixtures/bff1');
    expect(isBFFProject(appDir)).toBe(true);
    expect(mockAPI).toBeInstanceOf(Function);
  });
});
