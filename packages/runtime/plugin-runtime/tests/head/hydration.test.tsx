import { act } from 'react';
import type { Root } from 'react-dom/client';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { getInitialContext } from '../../src/core/context';
import type { HeadContext } from '../../src/core/head';
import { wrapRuntimeContextProvider } from '../../src/core/react/wrapper';
import { Helmet } from '../../src/exports/head';

function Page({ name }: { name: string }) {
  return (
    <>
      <Helmet
        defer={false}
        htmlAttributes={{ lang: name }}
        bodyAttributes={{ class: name }}
      >
        <title>{name}</title>
        <meta name="description" content={name} />
        <link rel="canonical" href={`https://example.com/${name}`} />
        <script type="application/ld+json">{JSON.stringify({ name })}</script>
      </Helmet>
      <p>{name}</p>
    </>
  );
}

it('takes over server tags once and updates them after client navigation', async () => {
  rstest.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const context: HeadContext = {};
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root | undefined;
  const errors: unknown[] = [];
  try {
    HelmetProvider.canUseDOM = false;
    container.innerHTML = renderToString(
      wrapRuntimeContextProvider(
        <Page name="first" />,
        getInitialContext(false),
        context,
      ),
    );
    HelmetProvider.canUseDOM = true;
    const head = context.helmet!;
    document.head.innerHTML = [
      head.title,
      head.meta,
      head.link,
      head.script,
    ].join('');
    document.documentElement.setAttribute('lang', 'first');
    document.body.className = 'first';
    await act(async () => {
      root = hydrateRoot(
        container,
        wrapRuntimeContextProvider(<Page name="first" />, getInitialContext()),
        {
          onRecoverableError: error => {
            errors.push(error);
          },
        },
      );
    });
    expect(errors).toEqual([]);
    expect(document.head.querySelectorAll('title')).toHaveLength(1);
    expect(
      document.head.querySelectorAll('meta[name="description"]'),
    ).toHaveLength(1);
    expect(
      document.head.querySelectorAll('link[rel="canonical"]'),
    ).toHaveLength(1);
    expect(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(1);

    await act(async () => {
      root?.render(
        wrapRuntimeContextProvider(<Page name="second" />, getInitialContext()),
      );
    });
    expect(document.title).toBe('second');
    expect(document.documentElement.lang).toBe('second');
    expect(document.body.className).toBe('second');
    expect(
      document.head.querySelectorAll('meta[name="description"]'),
    ).toHaveLength(1);
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe('second');
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    ).toBe('https://example.com/second');
    expect(
      document.head.querySelector('script[type="application/ld+json"]')
        ?.textContent,
    ).toBe('{"name":"second"}');

    await act(async () => {
      root?.render(
        wrapRuntimeContextProvider(<p>Without Helmet</p>, getInitialContext()),
      );
    });
    expect(
      document.head.querySelectorAll('meta[name="description"]'),
    ).toHaveLength(0);
    expect(
      document.head.querySelectorAll('link[rel="canonical"]'),
    ).toHaveLength(0);
    expect(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(0);
    expect(document.documentElement.hasAttribute('lang')).toBe(false);
    expect(document.body.hasAttribute('class')).toBe(false);
  } finally {
    HelmetProvider.canUseDOM = true;
    await act(async () => {
      root?.unmount();
    });
    container.remove();
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('lang');
    document.body.removeAttribute('class');
    rstest.unstubAllGlobals();
  }
});
