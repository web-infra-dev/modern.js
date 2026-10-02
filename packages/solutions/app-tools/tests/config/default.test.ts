import {
  createDefaultConfig,
  isLazyCompilationSafeByDefault,
} from '../../src/config';

describe('createDefaultConfig', () => {
  it('uses config/mock as the default Mock directory', () => {
    const config = createDefaultConfig({ metaName: 'modern' } as any);

    expect(config.dev?.mockDir).toBe('./config/mock');
  });
});

describe('isLazyCompilationSafeByDefault', () => {
  it('enables for pure CSR (no ssr / rsc / ssg)', () => {
    expect(isLazyCompilationSafeByDefault({})).toBe(true);
    expect(isLazyCompilationSafeByDefault({ server: {} })).toBe(true);
  });

  it('enables for `ssr: true` because Modern defaults it to stream SSR', () => {
    expect(isLazyCompilationSafeByDefault({ server: { ssr: true } })).toBe(
      true,
    );
  });

  it('enables for stream SSR', () => {
    expect(
      isLazyCompilationSafeByDefault({ server: { ssr: { mode: 'stream' } } }),
    ).toBe(true);
  });

  it('disables for string SSR', () => {
    expect(
      isLazyCompilationSafeByDefault({ server: { ssr: { mode: 'string' } } }),
    ).toBe(false);
  });

  it('enables when SSR entries are stream-only', () => {
    expect(
      isLazyCompilationSafeByDefault({
        server: { ssrByEntries: { a: false, b: true, c: { mode: 'stream' } } },
      }),
    ).toBe(true);
  });

  it('disables when any entry uses string SSR', () => {
    expect(
      isLazyCompilationSafeByDefault({
        server: { ssrByEntries: { a: false, b: { mode: 'string' } } },
      }),
    ).toBe(false);
  });

  it('disables for RSC', () => {
    expect(isLazyCompilationSafeByDefault({ server: { rsc: true } })).toBe(
      false,
    );
  });

  it('disables for SSG', () => {
    expect(isLazyCompilationSafeByDefault({ output: { ssg: true } })).toBe(
      false,
    );
  });

  it('disables for SSG by entries', () => {
    expect(
      isLazyCompilationSafeByDefault({
        output: { ssgByEntries: { main: true } },
      }),
    ).toBe(false);
  });
});
