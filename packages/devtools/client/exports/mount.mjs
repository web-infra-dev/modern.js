import { parseQuery } from 'ufo';
import routesManifest from '../dist/routes-manifest.json';

/**
 * @param {import('@modern-js/devtools-kit').SetupClientOptions} options
 */
const mountDevTools = options => {
  const container = document.createElement('div');
  container.className = '_modern_js_devtools_container';
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: 'closed' });

  for (const asset of routesManifest.routeAssets.mount.assets) {
    if (asset.endsWith('.js')) {
      const el = document.createElement('script');
      el.src = asset;
      shadow.appendChild(el);
    } else if (asset.endsWith('.css')) {
      const el = document.createElement('link');
      el.href = asset;
      el.rel = 'stylesheet';
      shadow.appendChild(el);
    }
  }

  const app = document.createElement('div');
  app.className = '_modern_js_devtools_mountpoint theme-register';
  const appGlobalExport = `_modern_js_devtools_app`;
  window[appGlobalExport] = {
    container: app,
    options,
  };
  shadow.appendChild(app);
};

try {
  // eslint-disable-next-line no-undef
  const opts = parseQuery(__resourceQuery);
  mountDevTools(opts);
} catch (err) {
  const e = new Error('Failed to execute mount point of DevTools.');
  e.cause = err;
  console.error(e);
}
