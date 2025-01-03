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
    typeof val === 'string'
      ? val.includes('node_modules')
        ? `"${val.replace(/'.+node_modules/, `'`)}"`
        : val.includes('modern.js')
          ? `"${val.replace(/'.+modern\.js/, `'`)}"`
          : `"${val.replace(root, '')}"`
      : (val as string),
});

describe('bff loader', () => {
  it('should works well', async () => {
    const pathString = path
      .resolve(__dirname, './fixtures/requestCreator/client.ts')
      .replace(/\\/g, '/');

    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/api',
      port: 80,
      target: 'client',
      requestCreator: pathString,
      appDir: '',
    });
    const output = stats?.toJson({ source: true }).modules?.[0].source;

    expect(output).toMatchSnapshot();
  });
});
