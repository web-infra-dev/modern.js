import {
  calculateSize,
  MemoryContainer,
} from '../../src/node/storer/container';

const KB = 1024;

describe('MemoryContainer size calculation', () => {
  it('should use the byte length of Buffer and TypedArray', () => {
    expect(calculateSize(Buffer.alloc(100 * KB, 1))).toBe(100 * KB);
    expect(calculateSize(new Uint16Array(10))).toBe(20);
    const view = Buffer.alloc(100).subarray(10, 30);
    expect(calculateSize(view)).toBe(20);
  });

  it('should use the length of string', () => {
    expect(calculateSize('hello')).toBe(5);
    expect(calculateSize('"quoted"\n')).toBe(9);
  });

  it('should use the serialized length of other values', () => {
    const value = { foo: 'bar', list: [1, 2] };
    expect(calculateSize(value)).toBe(JSON.stringify(value).length);
    expect(calculateSize(null)).toBe(4);
    expect(calculateSize(123)).toBe(3);
  });

  it('should return a positive integer for empty or unserializable values', () => {
    expect(calculateSize(Buffer.alloc(0))).toBe(1);
    expect(calculateSize('')).toBe(1);
    expect(calculateSize(() => {})).toBe(1);
  });

  it('should store empty values', async () => {
    const container = new MemoryContainer<string, any>();
    await container.set('buffer', Buffer.alloc(0));
    await container.set('string', '');
    await container.set('null', null);
    expect(await container.get('buffer')).toEqual(Buffer.alloc(0));
    expect(await container.get('string')).toBe('');
    expect(await container.get('null')).toBeNull();
  });

  it('should count Buffer by bytes and still evict by maxSize', async () => {
    // maxSize is 1 MB
    const container = new MemoryContainer<string, Buffer>({ max: 1 });
    const names = ['a', 'b', 'c'];
    for (const name of names) {
      await container.set(name, Buffer.alloc(300 * KB, 0xff));
    }
    // 900 KB fits in 1 MB, while serializing would count ~1.2 MB for each one
    for (const name of names) {
      expect(await container.has(name)).toBe(true);
    }

    await container.set('d', Buffer.alloc(300 * KB));
    expect(await container.has('a')).toBe(false);
    expect(await container.has('b')).toBe(true);
    expect(await container.has('d')).toBe(true);

    await container.set('large', Buffer.alloc(1024 * KB + 1));
    expect(await container.has('large')).toBe(false);
  });
});
