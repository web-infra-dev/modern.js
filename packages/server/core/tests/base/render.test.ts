import path from 'path';
import { createServerBase } from '../../src/base';
import { bindRenderHandler } from '../../src/base/renderHandler';
import { getDefaultConfig } from './helpers';

// eslint-disable-next-line node/no-unsupported-features/node-builtins
const { TextDecoder, TextEncoder } = require('util');

Object.assign(global, { TextDecoder, TextEncoder });

describe('should render html correctly', () => {
  const pwd = path.join(__dirname, './fixtures/render');

  it('should csr correctly', async () => {
    const csrPwd = path.join(pwd, 'csr');
    const config = getDefaultConfig();

    const server = await createServerBase({
      config,
      pwd: csrPwd,
    });

    await server.init();

    await bindRenderHandler(server, csrPwd, {
      pwd: csrPwd,
      config,
      routes: require(path.resolve(csrPwd, 'route.json')),
    });

    const response = await server.request('/');
    const html = await response.text();

    expect(html).toMatch(/Hello Modern/);
  });
});
