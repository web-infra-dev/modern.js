import path from 'path';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { compiler } from './compiler';

const apiDir = path.resolve(__dirname, './fixtures/function/api');
const filepath = path.resolve(__dirname, './fixtures/function/api/hello.ts');

initSnapshotSerializer({ cwd: __dirname });

describe('bff loader', () => {
  it('should works well', async () => {
    const stats = await compiler(filepath, {
      apiDir,
      lambdaDir: apiDir,
      existLambda: true,
      prefix: '/api',
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
