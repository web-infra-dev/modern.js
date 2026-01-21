import path from 'path';
import { fs } from '@modern-js/utils';
import { generateClient } from '../../src/client/generateClient';

const PWD = path.resolve(__dirname, '../fixtures/function');

describe('client', () => {
  test('generateClient should works correctly', async () => {
    const prefix = '/api';
    const port = 3000;
    const resourcePath = path.resolve(
      __dirname,
      '../fixtures/function/lambda/[id]/origin/foo.ts',
    );
    const source = await fs.readFile(resourcePath, 'utf-8');

    const result = await generateClient({
      appDir: __dirname,
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
      '../fixtures/function/lambda/normal/origin/index.js',
    );
    const source = await fs.readFile(resourcePath, 'utf-8');

    const result = await generateClient({
      appDir: __dirname,
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

  test('generateClient should support cross project invocation', async () => {
    const prefix = '/';
    const port = 3000;
    const resourcePath = path.resolve(
      __dirname,
      '../fixtures/function/lambda/normal/origin/index.js',
    );
    const source = await fs.readFile(resourcePath, 'utf-8');

    const result = await generateClient({
      appDir: __dirname,
      prefix,
      port,
      resourcePath,
      source,
      apiDir: PWD,
      lambdaDir: path.join(PWD, './lambda'),
      requireResolve: ((input: any) => input) as any,
      target: 'bundle',
    });
    expect(result.isOk).toBeTruthy();
    expect(result.value).toMatchSnapshot();
  });
});
