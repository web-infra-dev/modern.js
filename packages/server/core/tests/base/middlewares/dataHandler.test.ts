import path from 'path';
import { bindDataHandlers } from '@base/middlewares/dataHandler';
import { createDefaultServer } from '../helpers';

describe('test middlewares dataHandler', () => {
  const pwd = path.join(__dirname, '../fixtures/data');

  it("Shouldn't handle by data", async () => {
    const server = createDefaultServer();

    bindDataHandlers(
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

  it('Should handle by data', async () => {
    const server = createDefaultServer();

    bindDataHandlers(
      server,
      [
        {
          urlPath: '/',
          entryName: 'main',
          entryPath: '/',
        },
      ],
      pwd,
    );

    server.get('*', async c => {
      return c.text('render');
    });

    const response = await server.request('/');

    const text = await response.text();

    expect(text).toBe('handle data');
  });
});
