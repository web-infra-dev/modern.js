import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';
import { parseURL, resolveURL, stringifyParsedURL } from 'ufo';

const isProduction = process.env.NODE_ENV === 'production';
const url = parseURL(process.env.ASSET_PREFIX ?? '/devtools');
url.protocol ||= 'https:';
url.host ||= 'modernjs.dev';
const ASSET_PREFIX = stringifyParsedURL(url);
console.log('ASSET_PREFIX: ', ASSET_PREFIX);

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: url.pathname,
    },
  },
  dev: {
    port: 8780,
    assetPrefix: ASSET_PREFIX,
    proxy: {
      [`${ASSET_PREFIX}/static`]: resolveURL(
        'http://localhost:8780',
        url.pathname,
        'static',
      ),
      [ASSET_PREFIX]: 'http://localhost:8780',
    },
  },
  source: {
    preEntry: [require.resolve('modern-normalize/modern-normalize.css')],
    globalVars: {
      'process.env.PKG_VERSION': require('./package.json').version,
    },
  },
  output: {
    assetPrefix: ASSET_PREFIX,
    enableCssModuleTSDeclaration: true,
  },
  tools: {
    htmlPlugin(opts) {
      if (isProduction) {
        return { ...opts, filename: 'index.html' };
      } else {
        return opts;
      }
    },
    devServer: {
      client: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
  },
  html: {
    tags: [
      tags => {
        let i = tags.findIndex(({ tag }) => tag === 'script');
        i = Math.max(i, 0);
        const children = [
          'const serializedRedirect = sessionStorage.getItem("github-page-route-redirect");',
          'if (serializedRedirect) {',
          '  const redirect = JSON.parse(serializedRedirect);',
          '  if (redirect.final === window.location.pathname) {',
          '    sessionStorage.removeItem("github-page-route-redirect");',
          '    window.history.replaceState({}, "", redirect.final + redirect.rest);',
          '  }',
          '};',
        ].join('\n');
        tags.splice(i, 0, {
          tag: 'script',
          children,
          attrs: { 'data-github-page': true },
        });
      },
    ],
  },
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
    proxyPlugin(),
  ],
});
