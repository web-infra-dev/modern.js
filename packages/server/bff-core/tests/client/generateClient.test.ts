import path from 'path';
import { fs } from '@modern-js/utils';
import { generateClient } from '../../src/client/generateClient';

const PWD = path.resolve(__dirname, '../fixtures/function');

describe('client', () => {
  beforeAll(() => {
    jest.mock(
      '@modern-js/create-request',
      () => ({
        __esModule: true,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        createRequest: () => {},
      }),
      { virtual: true },
    );
  });

  test('generateClient should works correctly', async () => {
    const prefix = '/api';
    const port = 3000;
    const resourcePath = path.resolve(
      __dirname,
      '../fixtures/function/[id]/origin/foo.ts',
    );
    const source = await fs.readFile(resourcePath, 'utf-8');

    const result = await generateClient({
      prefix,
      port,
      resourcePath,
      source,
      apiDir: PWD,
      lambdaDir: path.join(PWD, './lambda'),
      requireResolve: ((input: any) => input) as any,
    });
    expect(result.isOk).toBeTruthy();
    expect(result.value).toMatchSnapshot();
  });

  test('generateClient should support operator', async () => {
    const prefix = '/';
    const port = 3000;
    const resourcePath = path.resolve(
      __dirname,
      '../fixtures/function/normal/origin/index.ts',
    );
    const source = await fs.readFile(resourcePath, 'utf-8');

    const result = await generateClient({
      prefix,
      port,
      resourcePath,
      source,
      apiDir: PWD,
      lambdaDir: path.join(PWD, './lambda'),
      requireResolve: ((input: any) => input) as any,
    });
    expect(result.isOk).toBeTruthy();
    expect(result.value).toMatchSnapshot();
  });
});
