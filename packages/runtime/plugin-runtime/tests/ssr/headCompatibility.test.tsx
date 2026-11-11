import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import type { HeadContext } from '../../src/core/head';
import Head, { Helmet } from '../../src/exports/head';

describe('framework Helmet compatibility', () => {
  it('exports the same component as default and named Helmet', () => {
    expect(Head).toBe(Helmet);
  });

  it('preserves legacy head content, attributes, escaping and nested overrides', () => {
    const render = () => {
      const Component = Helmet;
      return (
        <>
          <Component
            titleTemplate="%s | Modern"
            htmlAttributes={{ lang: 'en' }}
            bodyAttributes={{ class: 'dark' }}
          >
            <title>Parent</title>
            <meta name="description" content="parent" />
            <link rel="canonical" href="https://example.com/parent" />
          </Component>
          <Component>
            <title>{'Child & details'}</title>
            <meta name="description" content="child" />
            <link rel="canonical" href="https://example.com/child" />
            <script type="application/ld+json">
              {'{"name":"Child & details"}'}
            </script>
          </Component>
        </>
      );
    };
    const context: HeadContext = {};
    renderToString(
      <HelmetProvider context={context}>{render()}</HelmetProvider>,
    );
    const current = context.helmet!;
    const expected = {
      title: '<title data-rh="true">Child &amp; details | Modern</title>',
      htmlAttributes: 'lang="en"',
      bodyAttributes: 'class="dark"',
      meta: '<meta data-rh="true" name="description" content="child"/>',
      link: '<link data-rh="true" rel="canonical" href="https://example.com/child"/>',
      script:
        '<script data-rh="true" type="application/ld+json">{"name":"Child & details"}</script>',
    };
    for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
      expect(current[key].toString()).toBe(expected[key]);
    }
  });

  it('keeps independently created collectors separate', () => {
    const first: HeadContext = {};
    const second: HeadContext = {};
    renderToString(
      <HelmetProvider context={first}>
        <Helmet title="First" />
      </HelmetProvider>,
    );
    renderToString(
      <HelmetProvider context={second}>
        <Helmet title="Second" />
      </HelmetProvider>,
    );
    expect(first.helmet?.title.toString()).toBe(
      '<title data-rh="true">First</title>',
    );
    expect(second.helmet?.title.toString()).toBe(
      '<title data-rh="true">Second</title>',
    );
  });
});
