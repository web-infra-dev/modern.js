/* WARNING: NO ES6 SYNTAX HERE!!! */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-var */
import routesManifest from '../dist/routes-manifest.json';

(function () {
  /**
   * @param {import('@modern-js/devtools-kit').SetupClientOptions} options
   */
  function mountDevTools(options) {
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
    var appGlobalExport = `_modern_js_devtools_app`;
    window[appGlobalExport] = {
      container: app,
      options,
    };
    shadow.appendChild(app);
  }

  try {
    // eslint-disable-next-line no-undef
    var opts = decodeURIComponent(__resourceQuery);
    mountDevTools(opts);
  } catch (err) {
    var e = new Error('Failed to execute mount point of DevTools.');
    e.cause = err;
    console.error(e);
  }
})();
