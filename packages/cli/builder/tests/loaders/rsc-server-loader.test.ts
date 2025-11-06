import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import fs from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODERN_RSC_INFO, sharedData } from '../../src/rsc/common';
import rscServerLoader, {
  type RscServerLoaderOptions,
} from '../../src/rsc/rsc-server-loader';

async function callLoader(
  resourcePath: string,
  buildInfo?: Record<string, any>,
): Promise<string | Buffer> {
  const input = await fs.readFile(resourcePath);

  return new Promise((resolve, reject) => {
    const context: Partial<Rspack.LoaderContext<RscServerLoaderOptions>> = {
      getOptions: () => ({
        appDir: __dirname,
      }),
      resourcePath,
      cacheable: vi.fn(),
      _module: {
        buildInfo: buildInfo || {},
      } as any,
      async: () => context.callback!,
      callback: (error, content) => {
        if (error) {
          reject(error);
        } else if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(
            new Error(`Did not receive any content from rscServerLoader.`),
          );
        }
      },
    };

    rscServerLoader.call(
      context as Rspack.LoaderContext<RscServerLoaderOptions>,
      input.toString(`utf-8`),
    );
  });
}

describe('rscServerLoader', () => {
  beforeEach(() => {
    sharedData.clear();
  });

  it('support use client directive', async () => {
    const resourcePath = path.resolve(
      __dirname,
      `fixtures/client-component.jsx`,
    );
    const output = await callLoader(resourcePath);

    expect(output).toMatchSnapshot();
  });

  it(`should handle inline actions correctly`, async () => {
    const resourcePath = path.resolve(__dirname, `fixtures/inline-actions.tsx`);

    const output = await callLoader(resourcePath);

    expect(output).toMatchSnapshot();
  });

  it(`should handle server module correctly`, async () => {
    const resourcePath = path.resolve(__dirname, `fixtures/server-actions.ts`);

    const output = await callLoader(resourcePath);

    expect(output).toMatchSnapshot();
  });

  it('should generate client manifest correctly', async () => {
    const resourcePath = path.resolve(
      __dirname,
      `fixtures/client-component.jsx`,
    );

    const buildInfo: Record<string, any> = {};
    await callLoader(resourcePath, buildInfo);
    const { clientReferences } = buildInfo[MODERN_RSC_INFO];

    expect(clientReferences).toEqual([
      {
        id: 'fixtures/client-component.jsx#ClassA',
        exportName: 'ClassA',
      },
      {
        id: 'fixtures/client-component.jsx#ComponentA',
        exportName: 'ComponentA',
      },
      {
        id: 'fixtures/client-component.jsx#MemoizedComponentA',
        exportName: 'MemoizedComponentA',
      },
      {
        id: 'fixtures/client-component.jsx#ComponentB',
        exportName: 'ComponentB',
      },
      {
        id: 'fixtures/client-component.jsx#foo',
        exportName: 'foo',
      },
      {
        id: 'fixtures/client-component.jsx#ComponentC',
        exportName: 'ComponentC',
      },
      {
        id: 'fixtures/client-component.jsx#ComponentD',
        exportName: 'ComponentD',
      },
      {
        id: 'fixtures/client-component.jsx#bar',
        exportName: 'bar',
      },
      {
        id: 'fixtures/client-component.jsx#ComponentE',
        exportName: 'ComponentE',
      },
      {
        id: 'fixtures/client-component.jsx#ComponentF',
        exportName: 'ComponentF',
      },
      {
        id: 'fixtures/client-component.jsx#default',
        exportName: 'default',
      },
    ]);
  });

  it('should generate serverReferencesMap correctly', async () => {
    const resourcePath = path.resolve(__dirname, `fixtures/server-actions.ts`);

    const buildInfo: Record<string, any> = {};
    await callLoader(resourcePath, buildInfo);
    const { exportNames } = buildInfo[MODERN_RSC_INFO];
    expect(exportNames).toEqual([`foo`, `bar`, `b`, `default`]);
  });
});
