import path from 'path';
import type { Rspack } from '@rsbuild/core';
import { type Mock, beforeEach, describe, expect, it, rs } from '@rstest/core';
import fs from 'fs/promises';
import { type ServerReferencesMap, sharedData } from '../../src/rsc/common';
import rscClientLoader, {
  type ClientLoaderOptions,
} from '../../src/rsc/rsc-client-loader';

async function callLoader(
  resourcePath: string,
  options?: ClientLoaderOptions,
  emitError?: Mock<any[], (error: Error) => void>,
): Promise<string | Buffer> {
  const input = await fs.readFile(resourcePath);

  return new Promise((resolve, reject) => {
    const context: Partial<Rspack.LoaderContext<ClientLoaderOptions>> = {
      getOptions: () => options || {},
      resourcePath,
      cacheable: rs.fn(),
      emitError,
      async: () => context.callback!,
      callback: (error, content) => {
        if (error) {
          reject(error);
        } else if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(
            new Error(
              `Did not receive any content from webpackRscServerLoader.`,
            ),
          );
        }
      },
    };

    rscClientLoader.call(
      context as Rspack.LoaderContext<ClientLoaderOptions>,
      input.toString(`utf-8`),
      '',
    );
  });
}

describe('rscClientLoader', () => {
  beforeEach(() => {
    sharedData.clear();
  });

  it('should transform the input with `use server` directive', async () => {
    const resourcePath = path.resolve(__dirname, 'fixtures/server-actions.ts');

    sharedData.set(resourcePath, {
      moduleId: `test`,
      exportNames: [`foo`, `bar`],
    });
    const result = await callLoader(resourcePath);

    expect(result).toMatchSnapshot();
  });

  it('should not transform the input if it does not have `use server` directive', async () => {
    const resourcePath = path.resolve(
      __dirname,
      'fixtures/client-loader-client.ts',
    );

    sharedData.set(resourcePath, {
      moduleId: `test`,
      exportNames: [`foo`, `bar`],
    });

    const output = await callLoader(resourcePath);

    expect(output).toMatchSnapshot();
  });

  it('support a custom callServer', async () => {
    const resourcePath = path.resolve(__dirname, 'fixtures/server-actions.ts');

    sharedData.set(resourcePath, { moduleId: `test`, exportNames: [`foo`] });

    const callServerImport = `sdk/call-server`;

    const output = await callLoader(resourcePath, {
      callServerImport,
    });

    expect(output).toMatchSnapshot();
  });

  it('should emit an error is module info is missing', async () => {
    const resourcePath = path.resolve(__dirname, 'fixtures/server-actions.ts');

    const serverReferencesMap: ServerReferencesMap = new Map();
    const emitError = rs.fn();

    const output = await callLoader(resourcePath, {}, emitError);

    expect(emitError.mock.calls).toEqual([
      [
        new Error(
          `Could not find server module info in \`serverReferencesMap\` for ${resourcePath}.`,
        ),
      ],
    ]);

    expect(output).toEqual(``);
  });
});
