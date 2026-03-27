import { createServerBase } from '../src';
import { getDefaultAppContext, getDefaultConfig } from './helpers';

describe('server base', () => {
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
