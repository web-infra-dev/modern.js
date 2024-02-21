import { createServerBase, favionFallbackMiddleware } from '@base/index';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

describe('favionFallbackMiddleware', () => {
  it('should return 204 No Content for /favicon.ico', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });
    server.get('*', favionFallbackMiddleware);
    const response = await server.request('/favicon.ico');
    expect(response.status).toBe(204);
    expect(response.body).toBe(null);
  });
});
