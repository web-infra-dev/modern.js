import { createErrorHtml } from '../../src/utils';

it.each([
  [404, 'This page could not be found.'],
  [500, 'Internal Server Error.'],
])('renders the %s status and error message', (status, message) => {
  const html = createErrorHtml(status);

  expect(html).toContain(`<title>${status}: ${message}</title>`);
  expect(html).toContain(`<h1>${status}</h1>`);
  expect(html).toContain(message);
});
