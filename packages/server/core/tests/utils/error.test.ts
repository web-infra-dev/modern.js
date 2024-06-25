import { createErrorHtml } from '../../src/utils';

describe('test utils.error', () => {
  it('should get 404 error html', () => {
    const html = createErrorHtml(404);

    expect(html).toMatchSnapshot();
  });

  it('should get 500 error html', () => {
    const html = createErrorHtml(500);

    expect(html).toMatchSnapshot();
  });
});
