import path from 'path';
import { isDefaultExportFunction } from '../src/isDefaultExportFunction';

describe('is default export function', () => {
  const dir = path.resolve(__dirname, './fixtures/default-export');

  test('should return true when default export anonymous arrow function', () => {
    const file = path.join(dir, './arrow-function.ts');

    expect(isDefaultExportFunction(file)).toBe(true);
  });

  test(`should return true when default export anonymous function`, () => {
    const file = path.join(dir, './function.ts');

    expect(isDefaultExportFunction(file)).toBe(true);
  });

  test(`should return true when export named function`, () => {
    const file = path.join(dir, './named-function.ts');

    expect(isDefaultExportFunction(file)).toBe(true);
  });

  test(`should return false when export function variable `, () => {
    const file = path.join(dir, './export-variable.ts');

    expect(isDefaultExportFunction(file)).toBe(false);
  });

  test(`should return false when have no export`, () => {
    const file = path.join(dir, './no-export.js');

    expect(isDefaultExportFunction(file)).toBe(false);
  });

  test(`should return false when have no default export`, () => {
    const file = path.join(dir, './no-default-export.js');

    expect(isDefaultExportFunction(file)).toBe(false);
  });
});
