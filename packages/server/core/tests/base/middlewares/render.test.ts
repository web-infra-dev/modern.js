import path from 'path';
import { bindRenderHandler } from '@base/index';
import { createServerBase, injectReporter } from '../../../src/base';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

describe('should render html correctly', () => {
  const pwd = path.join(__dirname, '../fixtures/render');

  it('should csr correctly', async () => {
    const csrPwd = path.join(pwd, 'csr');
    const config = getDefaultConfig();

    const server = createServerBase({
      config,
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
    });

    server.use(injectReporter());

    await server.init();

    await bindRenderHandler(server, {
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
      config,
      routes: require(path.resolve(csrPwd, 'route.json')),
    });

    const response = await server.request('/', {}, {});
    const html = await response.text();

    expect(html).toMatch(/Hello Modern/);
  });
});
