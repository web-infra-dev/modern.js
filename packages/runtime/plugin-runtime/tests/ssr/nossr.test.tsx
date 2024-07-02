import React from 'react';
import ReactDOM from 'react-dom/server';
import { NoSSR } from '../../src/core/server/index';

describe('ssr', () => {
  it('nossr fallback', async () => {
    const html = ReactDOM.renderToStaticMarkup(
      <NoSSR fallback="csr fallback">Hello SSR</NoSSR>,
    );
    expect(html).toMatch('csr fallback');
  });
});
