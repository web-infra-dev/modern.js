import { createStorage } from '../../src/utils/storage';

describe('test utils.storage', () => {
  it('should keep context inside run scope', async () => {
    const { run, useHonoContext } = createStorage<{ id: number }>();

    await run({ id: 1 }, () => {
      expect(useHonoContext()).toEqual({ id: 1 });
    });
  });

  it('should throw when reading outside of run scope', () => {
    const { useHonoContext } = createStorage<{ id: number }>();

    expect(() => useHonoContext()).toThrowError(
      "Can't call useContext out of server scope",
    );
  });

  it('should not share context between independent storages', async () => {
    const a = createStorage<{ id: number }>();
    const b = createStorage<{ id: number }>();

    await a.run({ id: 1 }, () => {
      expect(() => b.useHonoContext()).toThrowError(
        "Can't call useContext out of server scope",
      );
    });
  });

  it('should share context across module copies via the same global key', async () => {
    // Each createStorage call with the same key models one loaded copy of
    // @modern-js/server-core (pnpm peer-variant duplication can load two).
    // The context written through one copy must be readable from the other,
    // otherwise BFF handlers resolve to the second copy and fail with
    // "Can't call useContext out of server scope".
    const hostCopy = createStorage<{ id: number }>('modern-js/test-storage');
    const pluginCopy = createStorage<{ id: number }>('modern-js/test-storage');

    await hostCopy.run({ id: 42 }, () => {
      expect(pluginCopy.useHonoContext()).toEqual({ id: 42 });
    });
  });
});
