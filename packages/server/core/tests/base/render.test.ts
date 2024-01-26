import path from 'path';
import { createServerBase } from '../../src/base';
import { bindRenderHandler } from '../../src/base/renderHandler';
import { getDefaultAppContext, getDefaultConfig } from './helpers';

describe('should render html correctly', () => {
  const pwd = path.join(__dirname, './fixtures/render');

  it('should csr correctly', async () => {
    const csrPwd = path.join(pwd, 'csr');
    const config = getDefaultConfig();

    const server = await createServerBase({
      config,
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
    });

    await server.init();

    await bindRenderHandler(server, {
      pwd: csrPwd,
      appContext: getDefaultAppContext(),
      config,
      routes: require(path.resolve(csrPwd, 'route.json')),
    });

    const response = await server.request('/');
    const html = await response.text();

    expect(html).toMatch(/Hello Modern/);
  });
});
