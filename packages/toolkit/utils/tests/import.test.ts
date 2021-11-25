import * as path from 'path';
import { getPackageJsonFrom } from '@/import';

describe('import utility', () => {
  test('should return package.json object when use project Folder path', () => {
    const importFixturesPath = path.join(
      __dirname,
      './fixtures/import/package-json-standard',
    );
    const packageJson = getPackageJsonFrom(importFixturesPath);

    expect(packageJson).not.toBe(undefined);

    expect(packageJson.name).toBe('import-fixtures');
  });

  test('should return package.json object when use package.json file path', () => {
    const importFixturesPackageJsonPath = path.join(
      __dirname,
      './fixtures/import/package-json-standard/package.json',
    );
    const packageJson = getPackageJsonFrom(importFixturesPackageJsonPath);

    expect(packageJson).not.toBe(undefined);

    expect(packageJson.name).toBe('import-fixtures');
  });

  test('should return undefined when not exist path', () => {
    const importFixturesPath = path.join('/fixtures/import-test');
    const packageJson = getPackageJsonFrom(importFixturesPath);

    expect(packageJson).toBe(undefined);
  });

  test('should return undefined when package.json is not standard json file', () => {
    const importFixturesPackageJsonPath = path.join(
      __dirname,
      './fixtures/import/package-json-error/package.json',
    );

    const packageJson = getPackageJsonFrom(importFixturesPackageJsonPath);
    expect(packageJson).toBe(undefined);
  });
});
