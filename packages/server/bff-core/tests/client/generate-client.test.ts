import path from 'path';
import { fs } from '@modern-js/utils';
import { generateClient } from '../../src/client/generate-client';

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

  test('generate-client should works correctly', async () => {
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
      requireResolve: ((input: any) => input) as any,
    });
    expect(result.isOk).toBeTruthy();
    expect(result.value)
      .toMatch(`import { createRequest } from '@modern-js/create-request';

export const get = createRequest('/api/:id/origin/foo', 'GET', process.env.PORT || 3000);
export const post = createRequest('/api/:id/origin/foo', 'POST', process.env.PORT || 3000);
`);
  });

  test('generate-client should support operator', async () => {
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
      requireResolve: ((input: any) => input) as any,
    });
    expect(result.isOk).toBeTruthy();
    expect(result.value)
      .toMatch(`import { createRequest } from '@modern-js/create-request';

export const DELETE = createRequest('/normal/origin', 'DELETE', process.env.PORT || 3000);
export default createRequest('/normal/origin', 'GET', process.env.PORT || 3000);
export const putRepo = createRequest('/put-repo', 'PUT', process.env.PORT || 3000);
`);
  });
});
