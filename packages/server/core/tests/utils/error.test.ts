import { ErrorDigest, createErrorHtml, onError } from '../../src';

it.each([
  [404, 'This page could not be found.'],
  [500, 'Internal Server Error.'],
])('renders the %s status and error message', (status, message) => {
  const html = createErrorHtml(status);

  expect(html).toContain(`<title>${status}: ${message}</title>`);
  expect(html).toContain(`<h1>${status}</h1>`);
  expect(html).toContain(message);
});

it.each([undefined, { redactHeaders: [] }])(
  'omits default sensitive headers from the console fallback with logger %j',
  logger => {
    const consoleError = rstest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const request = new Request('http://localhost/', {
      headers: { authorization: 'sample', 'x-request-id': 'request-1' },
    });

    onError(ErrorDigest.EINTER, 'test error', undefined, request, logger);

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('req.headers = {"x-request-id":"request-1"}'),
    );
  },
);
