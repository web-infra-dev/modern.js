import { renderToString } from 'react-dom/server';
import LegacyHelmet from 'react-helmet';
import { HelmetProvider } from 'react-helmet-async';
import type { HeadContext } from '../../src/core/head';
import Head, { Helmet } from '../../src/exports/head';

describe('framework Helmet compatibility', () => {
  it('exports the same component as default and named Helmet', () => {
    expect(Head).toBe(Helmet);
  });

  it('preserves legacy head content, attributes, escaping and nested overrides', () => {
    const render = (legacy: boolean) => {
      const Component = legacy ? LegacyHelmet : Helmet;
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
    renderToString(render(true));
    const legacy = LegacyHelmet.renderStatic();
    const context: HeadContext = {};
    renderToString(
      <HelmetProvider context={context}>{render(false)}</HelmetProvider>,
    );
    const current = context.helmet!;
    for (const key of [
      'title',
      'htmlAttributes',
      'bodyAttributes',
      'meta',
      'link',
      'script',
    ] as const) {
      expect(
        current[key].toString().replaceAll('data-rh', 'data-react-helmet'),
      ).toBe(legacy[key].toString());
    }
    expect(current.title.toString()).toContain('Child &amp; details | Modern');
    expect(current.meta.toString()).not.toContain('content="parent"');
    expect(current.link.toString()).not.toContain('/parent');
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
