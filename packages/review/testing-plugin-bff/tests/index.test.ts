import * as path from 'path';
import { isBFFProject } from '../src';
import mockAPI from '../src/mockAPI';

describe('testing-plugin-bff', () => {
  test('isBFFProject', () => {
    const appPath = path.resolve(__dirname, './fixtures/bff1');
    expect(isBFFProject(appPath)).toBe(true);
    expect(mockAPI).toBeInstanceOf(Function);
  });
});
