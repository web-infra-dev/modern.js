import { readDocumentCookie } from '../../src/core/browser/cookie';

it('retains normal browser cookies', () => {
  expect(readDocumentCookie({ cookie: 'session=abc; theme=dark' })).toBe(
    'session=abc; theme=dark',
  );
});
it('allows initialization when a sandbox blocks cookie access', () => {
  expect(
    readDocumentCookie({
      get cookie(): string {
        throw new DOMException('Blocked by sandbox', 'SecurityError');
      },
    }),
  ).toBe('');
});
it('does not hide unrelated errors', () => {
  expect(() =>
    readDocumentCookie({
      get cookie(): string {
        throw new Error('unexpected');
      },
    }),
  ).toThrow('unexpected');
});
