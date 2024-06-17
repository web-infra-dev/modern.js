/* eslint-disable node/prefer-global/url */
/* eslint-disable node/no-unsupported-features/node-builtins */
/// <reference lib="dom" />
import { reviver, ServerManifest } from '@modern-js/devtools-kit/runtime';

/**
 * Implement sync fetch based on XMLRequest.
 * Used to block the main thread while requesting.
 */
const fetchSync = (
  url: string,
  body?: Document | XMLHttpRequestBodyInit | null,
) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(body);
  return {
    text() {
      return xhr.responseText;
    },
    json(reviver?: (this: any, key: string, value: any) => any): any {
      return JSON.parse(xhr.responseText, reviver);
    },
    blob() {
      return new Blob([xhr.response]);
    },
  };
};

/**
 * Inject script into the page by creating and appending script tag into document.
 * Acting like {@link https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts}
 */
const importScript = (url: string) => {
  const script = document.createElement('script');
  script.setAttribute('src', url);
  document.head.appendChild(script);
};

const importStyle = (
  url: string | URL,
  parent: HTMLElement | DocumentFragment = document.head,
) => {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', url.toString());
  parent.appendChild(link);
};

const GLOBAL_MANIFEST = 'window.__modern_js_devtools_manifest';

const setup = () => {
  const injectedManifestUrl = process.env.__USE_MODERNJS_DEVTOOLS__;
  const cookieManifestUrl = document.cookie.match(
    /use_modernjs_devtools=([^;]+)/,
  )?.[1];
  const devtoolsUrl = cookieManifestUrl || injectedManifestUrl;
  if (!devtoolsUrl) return;
  const manifest: ServerManifest = fetchSync(devtoolsUrl).json(reviver());
  manifest.source = devtoolsUrl;

  // Inject JavaScript chunks to client.
  const template = document.createElement('template');
  template.id = '_modern_js_devtools_styles';
  document.body.appendChild(template);

  const setupScript = document.createElement('script');
  setupScript.textContent = `${GLOBAL_MANIFEST} = ${JSON.stringify(manifest)};`;
  document.head.appendChild(setupScript);

  // Inject styles.
  for (const src of manifest.routeAssets.mount.assets) {
    if (src.endsWith('.js')) {
      importScript(src);
    } else if (src.endsWith('.css')) {
      // Inject CSS chunks to client inside of template to avoid polluting global.
      importStyle(src, template.content);
    }
  }
};

try {
  setup();
} catch (e) {
  const err = new Error('Failed to setup Modern.js DevTools.');
  err.cause = e;
  console.error(err);
}
