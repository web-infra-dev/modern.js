import { compatPlugin, createServerBase, faviconPlugin } from '../../src';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

describe('favion plugin', () => {
  it('should return 204 No Content for /favicon.ico', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });

    server.addPlugins([compatPlugin(), faviconPlugin()]);

    await server.init();
    const response = await server.request('/favicon.ico');
    expect(response.status).toBe(204);
    expect(response.body).toBe(null);
  });

  it('should support registering options handler', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });

    server.options('/api/ping', c => c.body(null, 204));

    const response = await server.request('/api/ping', {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(204);
    expect(response.body).toBe(null);
  });
});
