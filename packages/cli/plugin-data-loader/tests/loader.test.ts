import path from 'path';
import { fs } from '@modern-js/utils';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { compiler } from './compiler';

// compiler needs setImmediate
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.setImmediate = setTimeout;

initSnapshotSerializer({ cwd: path.resolve(__dirname) });

describe('data loader', () => {
  let id = 0;
  const routesDir = path.join(__dirname, 'fixtures/loader');
  const mapFile = path.join(__dirname, 'fixtures/loader/map.json');
  const dataLoaderPath = `${path.resolve(__dirname, '../src/cli/loader.ts')}!`;

  const loaderPath = `${dataLoaderPath}./loader?mapFile=${mapFile}`.replace(
    /\\/g,
    '/',
  );

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
