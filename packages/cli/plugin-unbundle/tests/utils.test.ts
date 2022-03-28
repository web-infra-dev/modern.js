import * as path from 'path';
import type { NormalizedConfig } from '@modern-js/core';
import {
  shouldUseBff,
  hasBffPlugin,
  setIgnoreDependencies,
  replaceAsync,
} from '../src/utils';
import type {} from '../src/typings';

describe('plugin-unbundle utils', () => {
  test('should use bff correctly', () => {
    const appDirectory1 = path.join(__dirname, './fixtures/tailwind-example');
    expect(hasBffPlugin(appDirectory1)).toBe(false);

    const appDirectory2 = path.join(__dirname, './fixtures/scan-imports');
    expect(hasBffPlugin(appDirectory2)).toBe(true);
    expect(shouldUseBff(appDirectory2)).toBe(false);
  });

  test('setIgnoreDependencies', () => {
    const virtualDeps: any = {
      test: 'test',
    };
    const userConfig = {} as NormalizedConfig;
    setIgnoreDependencies(userConfig, virtualDeps);
    expect(virtualDeps).toMatchObject({ test: 'test' });

    userConfig.dev = {
      unbundle: {
        ignore: 'test0',
      },
    };

    const testExport = /export\s+{.*}\s*;/m;
    const testExportDefault = /export\s+default\s+{.*}\s*;/;

    setIgnoreDependencies(userConfig, virtualDeps);
    expect(virtualDeps.test0).toBeTruthy();
    expect(testExport.test(virtualDeps.test0)).toBeTruthy();
    expect(testExportDefault.test(virtualDeps.test0)).toBeTruthy();

    userConfig.dev.unbundle!.ignore = ['test1', 'test2', 'test-3'];
    setIgnoreDependencies(userConfig, virtualDeps);
    for (const testDep of userConfig.dev.unbundle!.ignore!) {
      expect(virtualDeps[testDep]).toBeTruthy();
      expect(testExport.test(virtualDeps[testDep])).toBeTruthy();
      expect(testExportDefault.test(virtualDeps[testDep])).toBeTruthy();
    }
  });

  test('replaceAsync', async () => {
    const simpleReplaceStr = 'test1, test2, test3, test4';
    const simpleResult = await replaceAsync(
      simpleReplaceStr,
      /test/,
      'noTest' as any,
    );
    expect(simpleResult.includes('test')).toBeTruthy();
    expect(simpleResult.includes('noTest')).toBeTruthy();

    let count = 0;
    const sleep = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms));
    const replacer = async (match: string) => {
      count++;
      await sleep(50);
      return `${match}-${count}`;
    };
    const complicatedReplaceStr = 'test, test, test, test, test';
    const complicatedResult = await replaceAsync(
      complicatedReplaceStr,
      /test/g,
      replacer,
    );
    expect(complicatedResult.includes('test-5')).toBeTruthy();
  });
});
