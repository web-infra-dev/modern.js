import path from 'path';
import { fs } from '@modern-js/utils';
import { compiler } from './compiler';

// compiler needs setImmediate
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.setImmediate = setTimeout;

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

describe('data loader', () => {
  let id = 0;
  const routesDir = path.join(__dirname, 'fixtures/loader');
  const dataLoaderPath = `${path.resolve(
    __dirname,
    '../src/cli/loader.ts',
  )}?routesDir=${routesDir}!`;

  const loaderPath = `${dataLoaderPath}./loader`.replace(/\\/g, '/');

  const code = `
  import loader from '${loaderPath}';

  const request = new Request('http://localhost:8080/user/profile');

  loader({
    request,
    params: {},
  });
`;

  test('basic usage', async () => {
    const entryFile = path.join(routesDir, `index_${id}.ts`);
    id++;
    fs.writeFileSync(entryFile, code);
    const stats = await compiler(entryFile, 'web');
    const modules = stats?.toJson({ source: true }).modules;
    const output = modules?.[1].source;
    expect(output).toMatchSnapshot();
    fs.unlinkSync(entryFile);
  });
});
