import path from 'node:path';
import { loadServerPlugins } from '../../src/adapters/node';

const modulePath = path.join(__dirname, '../fixtures/load-plugins');
describe('test load plugin', () => {
  it('should load string plugin correctly', async () => {
    const loaded = await loadServerPlugins([{ name: './test-a' }], modulePath);
    expect(loaded[0].name).toBe('test-a');
  });

  it('should throw error if plugin not found', async () => {
    await expect(
      loadServerPlugins([{ name: 'test-b' }], modulePath),
    ).rejects.toThrow('Can not find module test-b.');
  });
});
