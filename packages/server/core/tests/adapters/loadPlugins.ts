import path from 'path';
import { loadServerPlugins } from '../../src/adapters/node/helper';

const modulePath = path.join(__dirname, './fixtures/load-plugins');
describe('test load plugin', () => {
  it('should load string plugin correctly', async () => {
    const loaded = await loadServerPlugins([{ name: 'test-a' }], modulePath);
    expect(loaded[0].name).toBe('test-a');
  });

  it('should throw error if plugin not found', async () => {
    try {
      await loadServerPlugins([{ name: 'test-b' }], modulePath);
    } catch (e: any) {
      expect(e.message).toMatch('Can not find module test-b.');
    }
  });
});
