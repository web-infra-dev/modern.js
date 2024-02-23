import path from 'path';
import { bindDataHandlers } from '../../../src/base/middlewares/dataHandler';
import { createDefaultServer } from '../helpers';

describe('test middlewares dataHandler', () => {
  const pwd = path.join(__dirname, '../fixtures/data');

  it("shouldn't handle by data", async () => {
    const server = createDefaultServer();

    await bindDataHandlers(
      server,
      [
        {
          urlPath: '/',
          entryName: 'main',
          entryPath: '/',
        },
      ],
      '',
    );

    server.get('*', async c => {
      return c.text('render');
    });

    const response = await server.request('/');

    const text = await response.text();

    expect(text).toBe('render');
  });

  it('should handle by data correctly', async () => {
    const server = createDefaultServer();

    await bindDataHandlers(
      server,
      [
        {
          urlPath: '/',
          entryName: 'main',
          entryPath: '/',
        },
        {
          urlPath: '/user',
          entryName: 'user',
          entryPath: '/user',
        },
      ],
      pwd,
    );

    server.get('*', async c => {
      return c.text('render');
    });

    const response = await server.request('/');
    const text = await response.text();
    expect(text).toBe('handle main');

    const response1 = await server.request('/user/page');
    const text1 = await response1.text();
    expect(text1).toBe('handle user');
  });
});
