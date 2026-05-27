import { isLazyCompilationSafeByDefault } from '../../src/config';

describe('isLazyCompilationSafeByDefault', () => {
  it('enables for pure CSR (no ssr / rsc / ssg)', () => {
    expect(isLazyCompilationSafeByDefault({})).toBe(true);
    expect(isLazyCompilationSafeByDefault({ server: {} })).toBe(true);
  });

  it('disables for `ssr: true`', () => {
    expect(isLazyCompilationSafeByDefault({ server: { ssr: true } })).toBe(
      false,
    );
  });

  it('disables for stream SSR', () => {
    expect(
      isLazyCompilationSafeByDefault({ server: { ssr: { mode: 'stream' } } }),
    ).toBe(false);
  });

  it('disables for string SSR', () => {
    expect(
      isLazyCompilationSafeByDefault({ server: { ssr: { mode: 'string' } } }),
    ).toBe(false);
  });

  it('disables when any entry uses SSR', () => {
    expect(
      isLazyCompilationSafeByDefault({
        server: { ssrByEntries: { a: false, b: { mode: 'stream' } } },
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
