import { createMemoryStorage } from '../../src/node/storer';

describe('createMemoryStorage', () => {
  it('round-trips empty buffers, empty strings and null', async () => {
    const storage = createMemoryStorage<Buffer | string | null>('empty-values');
    try {
      await storage.set('buffer', Buffer.alloc(0));
      await storage.set('string', '');
      await storage.set('null', null);
      expect(await storage.has('buffer')).toBe(true);
      expect(await storage.get('buffer')).toEqual(Buffer.alloc(0));
      expect(await storage.has('string')).toBe(true);
      expect(await storage.get('string')).toBe('');
      expect(await storage.has('null')).toBe(true);
      expect(await storage.get('null')).toBeNull();
    } finally {
      await Promise.all(
        ['buffer', 'string', 'null'].map(key => storage.delete(key)),
      );
    }
  });

  it('isolates values and deletion across namespaces', async () => {
    const first = createMemoryStorage<string>('first-namespace');
    const second = createMemoryStorage<string>('second-namespace');
    try {
      await first.set('shared-key', 'first');
      expect(await second.has('shared-key')).toBe(false);
      await second.set('shared-key', 'second');
      expect(await first.get('shared-key')).toBe('first');
      expect(await second.get('shared-key')).toBe('second');
      expect(await first.delete('shared-key')).toBe(true);
      expect(await first.get('shared-key')).toBeUndefined();
      expect(await second.get('shared-key')).toBe('second');
    } finally {
      await first.delete('shared-key');
      await second.delete('shared-key');
    }
  });

  it('stores and removes a large buffer', async () => {
    const storage = createMemoryStorage<Buffer>('large-buffer');
    const buffer = Buffer.alloc(2 * 1024 * 1024, 0xff);
    try {
      await storage.set('asset', buffer);
      expect(await storage.has('asset')).toBe(true);
      expect(await storage.get('asset')).toEqual(buffer);
      expect(await storage.delete('asset')).toBe(true);
      expect(await storage.has('asset')).toBe(false);
      expect(await storage.get('asset')).toBeUndefined();
    } finally {
      await storage.delete('asset');
    }
  });
});
