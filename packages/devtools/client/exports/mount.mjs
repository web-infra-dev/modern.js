/* WARNING: NO ES6 SYNTAX HERE!!! */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-var */
import routesManifest from '../dist/routes-manifest.json';

(function () {
  try {
    var container = document.createElement('div');
    container.className = '_modern_js_devtools_container';
    document.body.appendChild(container);

    var shadow = container.attachShadow({ mode: 'closed' });

    routesManifest.routeAssets.mount.assets.forEach(function (asset) {
      var el;
      if (asset.endsWith('.js')) {
        el = document.createElement('script');
        el.src = asset;
      } else if (asset.endsWith('.css')) {
        el = document.createElement('link');
        el.href = asset;
        el.rel = 'stylesheet';
      }
      shadow.appendChild(el);
    });

    var app = document.createElement('div');
    app.className = '_modern_js_devtools_mountpoint theme-register';
    var appGlobalExport = '_modern_js_devtools_app';
    window[appGlobalExport] = {
      container: app,
      // eslint-disable-next-line no-undef
      resourceQuery: __resourceQuery,
    };
    shadow.appendChild(app);
  } catch (err) {
    var e = new Error('Failed to execute mount point of DevTools.');
    e.cause = err;
    console.error(e);
  }
})();
