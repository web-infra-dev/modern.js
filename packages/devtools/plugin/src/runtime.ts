/* eslint-disable node/prefer-global/url */
/* eslint-disable node/no-unsupported-features/node-builtins */
/// <reference lib="dom" />
import type { ServerManifest } from '@modern-js/devtools-kit/runtime';
import { initialize } from 'react-devtools-inline/backend';

if (process.env.NODE_ENV === 'development' && !window.opener) {
  try {
    // Delete existing devtools hooks registered by react devtools extension.
    try {
      // @ts-expect-error: Workaround for the importing `react` from `react-devtools-inline/backend` internally.
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } catch {}
    // Call this before importing React (or any other packages that might import React).
    initialize(window);
    // Deny react devtools extension to activate.
    const originSubHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.sub;
    // @ts-expect-error
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.sub = (e: any, handler) => {
      if (e === 'devtools-backend-installed') {
        return undefined;
      }
      return originSubHook(e, handler);
    };
  } catch (err) {
    const e = new Error('Failed to inject React DevTools backend.');
    e.cause = err;
    console.error(e);
  }
}

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
  script.async = false;
  script.defer = false;
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
  const devtoolsUrl = injectedManifestUrl || cookieManifestUrl;
  if (!devtoolsUrl) return;
  const manifest: ServerManifest = fetchSync(devtoolsUrl).json();
  manifest.source = devtoolsUrl;
  // Skip if no client assets.
  if (!manifest.client) return;

  // Inject JavaScript chunks to client.
  const template = document.createElement('template');
  template.id = '_modern_js_devtools_styles';
  document.body.appendChild(template);

  const setupScript = document.createElement('script');
  setupScript.textContent = `${GLOBAL_MANIFEST} = ${JSON.stringify(manifest)};`;
  document.head.appendChild(setupScript);

  // Inject styles.
  const routeAssets =
    typeof manifest.routeAssets === 'object'
      ? manifest.routeAssets
      : fetchSync(manifest.routeAssets).json().routeAssets;
  for (const src of routeAssets.mount.assets) {
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
