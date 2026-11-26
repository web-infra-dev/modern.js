import { rs } from '@rstest/core';
import { createBffServer } from './bffServer';

describe('BFF HTTP dispatch', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it.each(['development', 'production'])(
    'serves API routes before the render fallback in %s',
    async env => {
      rs.stubEnv('NODE_ENV', env);
      const server = await createBffServer('/custom-api');
      const response = await server.request('/custom-api/hello?name=modern');
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        query: { name: 'modern' },
      });

      for (const path of ['/custom-api/missing', '/some/page', '/api/hello']) {
        const fallback = await server.request(path);
        expect(fallback.status).toBe(200);
        expect(await fallback.text()).toBe('render');
      }
    },
  );

  it('leaves requests to the configured non-Hono runtime', async () => {
    const server = await createBffServer('/api', 'express');
    const response = await server.request('/api/hello');
    expect(await response.text()).toBe('render');
  });
});
