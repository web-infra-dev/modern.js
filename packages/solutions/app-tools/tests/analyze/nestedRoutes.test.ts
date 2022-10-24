import path from 'path';
import { walk } from '../../src/analyze/nestedRoutes';

const fixtures = path.join(__dirname, 'fixtures');

describe('nested routes', () => {
  test('walk', async () => {
    const routesDir = path.join(fixtures, './nested-routes');
    const route = await walk(routesDir, routesDir, {
      name: '@_modern_js_src',
      basename: routesDir,
    });
    expect(route).toMatchSnapshot();
  });
});
