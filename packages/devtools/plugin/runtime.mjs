import { mountDevTools } from '@modern-js/devtools-mount';

const dataSource = '/_modern_js/devtools/rpc';

if (dataSource.startsWith('/')) {
  const url = new window.URL(window.location);
  url.protocol = 'ws:';
  url.pathname = dataSource;
  mountDevTools({ dataSource: url.href });
} else {
  throw new Error('Unimplemented.');
}
