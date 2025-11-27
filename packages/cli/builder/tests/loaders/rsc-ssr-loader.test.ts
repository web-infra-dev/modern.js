import path from 'path';
import url from 'url';
import type { Rspack } from '@rsbuild/core';
import { describe, expect, it, rs } from '@rstest/core';
import fs from 'fs/promises';
import { MODERN_RSC_INFO } from '../../src/rsc/common';
import rscSsrLoader, {
  type RscSsrLoaderOptions,
} from '../../src/rsc/rsc-ssr-loader';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

async function callLoader(
  resourcePath: string,
  buildInfo?: Record<string, any>,
): Promise<string | Buffer> {
  const input = await fs.readFile(resourcePath);

  return new Promise((resolve, reject) => {
    const context: Partial<Rspack.LoaderContext<RscSsrLoaderOptions>> = {
      getOptions: () => ({}),
      resourcePath,
      cacheable: rs.fn(),
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
          reject(new Error(`Did not receive any content from rscSsrLoader.`));
        }
      },
    };

    rscSsrLoader.call(
      context as Rspack.LoaderContext<RscSsrLoaderOptions>,
      input.toString(`utf-8`),
      '',
    );
  });
}

describe('rscSsrLoader', () => {
  it('should transform server module correctly', async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `fixtures/server-actions.ts`,
    );

    const output = await callLoader(resourcePath);

    expect(output).toMatchSnapshot();
  });

  it('should not transform non server module', async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `fixtures/client-component.jsx`,
    );

    const output = await callLoader(resourcePath);

    expect(output).toMatchSnapshot();
  });

  it('should get serverReferencesMap correctly', async () => {
    const buildInfo: Record<string, any> = {};
    const resourcePath = path.resolve(
      currentDirname,
      `fixtures/server-actions.ts`,
    );

    await callLoader(resourcePath, buildInfo);
    const { exportNames } = buildInfo[MODERN_RSC_INFO];

    expect(exportNames).toEqual([`foo`, `bar`, `b`, `default`]);
  });
});
