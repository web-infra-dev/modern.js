import path from 'path';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { walk } from '../../src/analyze/nestedRoutes';

const fixtures = path.join(__dirname, 'fixtures');

initSnapshotSerializer({ cwd: path.resolve(__dirname, '../..') });

describe('nested routes', () => {
  test('walk', async () => {
    const routesDir = path.join(fixtures, './nested-routes');
    const route = await walk(
      routesDir,
      routesDir,
      {
        name: '@_modern_js_src',
        basename: routesDir,
      },
      'main',
    );
    expect(route).toMatchSnapshot();
  });
});
