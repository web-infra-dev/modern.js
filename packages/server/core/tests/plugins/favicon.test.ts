import { createServerBase, faviconPlugin } from '../../src';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

describe('favion plugin', () => {
  it('should return 204 No Content for /favicon.ico', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });

    server.addPlugins([faviconPlugin()]);

    await server.init();
    const response = await server.request('/favicon.ico');
    expect(response.status).toBe(204);
    expect(response.body).toBe(null);
  });
});
