import path from 'path';
import { compiler } from './compiler';

const apiDir = path.resolve(__dirname, './fixtures/function/api');
const filepath = path.resolve(__dirname, './fixtures/function/api/hello.ts');

const root = path.resolve(__dirname, '../../../../');
expect.addSnapshotSerializer({
  test: val =>
    typeof val === 'string' &&
    (val.includes('modern.js') ||
      val.includes('node_modules') ||
      val.includes(root)),
  print: val =>
    // eslint-disable-next-line no-nested-ternary
    typeof val === 'string'
      ? // eslint-disable-next-line no-nested-ternary
        val.includes('node_modules')
        ? `"${val.replace(/'.+node_modules/, `'`)}"`
        : val.includes('modern.js')
        ? `"${val.replace(/'.+modern\.js/, `'`)}"`
        : `"${val.replace(root, '')}"`
      : (val as string),
});

describe('bff loader', () => {
  it('should work well', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/',
      port: 3000,
      target: 'server',
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;
    expect(output).toMatchSnapshot();
  });

  it('should work well with prefix', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: 'api',
      port: 3000,
      target: 'server',
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;

    expect(output).toMatchSnapshot();
  });

  it('should work well with client', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/',
      port: 3000,
      target: 'server',
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;

    expect(output).toMatchSnapshot();
  });

  it('should work well with port', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/',
      port: 80,
      target: 'server',
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;

    expect(output).toMatchSnapshot();
  });

  // TODO: 暂时有问题，先屏蔽这个测试
  it.skip('should work well with fetcher', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/',
      port: 80,
      target: 'client',
      fetcher: path
        .resolve(__dirname, './fixtures/testFetcher')
        .replace(/\\/g, '/'),
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;

    expect(output).toMatchSnapshot();
  });

  it('should work well with requestCreator', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/',
      port: 80,
      target: 'client',
      requestCreator: path
        .resolve(__dirname, './fixtures/requestCreator')
        .replace(/\\/g, '/'),
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;

    expect(output).toMatchSnapshot();
  });
});
