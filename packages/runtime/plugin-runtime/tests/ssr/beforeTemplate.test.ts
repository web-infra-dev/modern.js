import { hasStylesheetLink } from '../../src/core/server/stream/beforeTemplate';

describe('hasStylesheetLink', () => {
  const href = '/static/css/async/three_user/page.css';

  test('returns true for stylesheet links', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="stylesheet" />`, href),
    ).toBe(true);
  });

  test('returns true when attributes are reordered', () => {
    expect(
      hasStylesheetLink(
        `<link rel="stylesheet" data-test="style" href="${href}">`,
        href,
      ),
    ).toBe(true);
  });

  test('returns true for single quoted stylesheet links', () => {
    expect(
      hasStylesheetLink(`<link rel='stylesheet' href='${href}'>`, href),
    ).toBe(true);
  });

  test('returns true when rel contains multiple tokens', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="preload stylesheet">`, href),
    ).toBe(true);
  });

  test('returns false for prefetch links', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="prefetch">`, href),
    ).toBe(false);
  });

  test('returns false for preload style links', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="preload" as="style">`, href),
    ).toBe(false);
  });

  test('returns false for different hrefs', () => {
    expect(
      hasStylesheetLink(
        `<link href="/static/css/async/other/page.css" rel="stylesheet">`,
        href,
      ),
    ).toBe(false);
  });
});
