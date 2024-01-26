import { createServerBase, favionFallbackMiddleware } from '../../src/base';
import { getDefaultAppContext, getDefaultConfig } from './helpers';

describe('middleware', () => {
  describe('favionFallbackMiddleware', () => {
    it('should return 204 No Content for /favicon.ico', async () => {
      const server = await createServerBase({
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
});
