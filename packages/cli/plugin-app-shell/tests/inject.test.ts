import { describe, expect, it } from '@rstest/core';
import { toRuntimeConfig } from '../src/config';
import {
  getHeadStylesheets,
  injectAppShell,
  SHELL_ELEMENT_ID,
} from '../src/inject';

const TEMPLATE =
  '<!doctype html><html data-theme="light"><head><meta charset="utf-8">' +
  '<link href="//cdn.test/static/css/main.css" rel="preload" as="style">' +
  '<link href="//cdn.test/static/css/main.css" rel="stylesheet">' +
  '<script defer src="//cdn.test/static/js/main.js"></script></head>' +
  '<body><div id="root"><!--<?- html ?>--></div><!--<?- chunksMap.js ?>--></body></html>';

const config = toRuntimeConfig(
  { component: './shell.tsx', routes: ['/chat'], readySelector: 'textarea' },
  'root',
);

describe('injectAppShell', () => {
  it('places the shell after the mount node and leaves the mount node and SSR placeholders untouched', () => {
    const html = injectAppShell(TEMPLATE, {
      config,
      shellHtml: '<textarea data-app-shell-input></textarea>',
      criticalCss: '.x{color:red}',
    });
    expect(html).toContain(
      `<div id="root"><!--<?- html ?>--></div><div id="${SHELL_ELEMENT_ID}" data-app-shell-root><textarea data-app-shell-input></textarea></div><script data-app-shell-runtime>`,
    );
    expect(html).toContain('<!--<?- chunksMap.js ?>-->');
  });

  it('inlines the critical CSS and the gate script before the first stylesheet link', () => {
    const html = injectAppShell(TEMPLATE, {
      config,
      shellHtml: '<p>shell</p>',
      criticalCss: '.x{color:red}',
    });
    const style = html.indexOf('<style data-app-shell-style>');
    const gate = html.indexOf('<script data-app-shell-gate>');
    const link = html.indexOf('rel="stylesheet"');
    expect(style).toBeGreaterThan(html.indexOf('<head>'));
    expect(gate).toBeGreaterThan(style);
    expect(link).toBeGreaterThan(gate);
    expect(html).toContain('.x{color:red}</style>');
  });

  it('keeps stylesheets render-blocking unless deferStylesheets is set', () => {
    const blocking = injectAppShell(TEMPLATE, {
      config,
      shellHtml: '<p>shell</p>',
      criticalCss: '',
    });
    expect(blocking).toContain(
      '<link href="//cdn.test/static/css/main.css" rel="stylesheet">',
    );
    expect(blocking).not.toContain('data-app-shell-links');

    const deferred = injectAppShell(TEMPLATE, {
      config: { ...config, deferStylesheets: true },
      shellHtml: '<p>shell</p>',
      criticalCss: '',
    });
    expect(deferred).toContain(
      '<link href="//cdn.test/static/css/main.css" rel="stylesheet" media="print" data-app-shell-defer="all"><script data-app-shell-links>',
    );
    // the preload hint is not a stylesheet and stays as is
    expect(deferred).toContain(
      '<link href="//cdn.test/static/css/main.css" rel="preload" as="style">',
    );
  });

  it('returns the HTML unchanged when the shell is already injected', () => {
    const once = injectAppShell(TEMPLATE, {
      config,
      shellHtml: '<p>shell</p>',
      criticalCss: '',
    });
    expect(
      injectAppShell(once, {
        config,
        shellHtml: '<p>shell</p>',
        criticalCss: '',
      }),
    ).toBe(once);
  });

  it('rejects a template whose mount node already contains markup', () => {
    expect(() =>
      injectAppShell(TEMPLATE.replace('<!--<?- html ?>-->', '<div>x</div>'), {
        config,
        shellHtml: '<p>shell</p>',
        criticalCss: '',
      }),
    ).toThrow('mount node #root is not empty in the HTML template');
  });

  it('escapes closing tags in inlined CSS', () => {
    const html = injectAppShell(TEMPLATE, {
      config,
      shellHtml: '<p>shell</p>',
      criticalCss: '.a::after{content:"</style>"}',
    });
    expect(html).toContain('content:"<\\/style>"');
  });
});

describe('getHeadStylesheets', () => {
  it('lists stylesheet hrefs from <head> in document order, ignoring preload hints', () => {
    expect(
      getHeadStylesheets(
        '<html><head><link rel="preload" href="/a.css" as="style"><link rel="stylesheet" href="/a.css"><link href=\'/b.css\' rel=stylesheet></head><body><link rel="stylesheet" href="/c.css"></body></html>',
      ),
    ).toEqual(['/a.css', '/b.css']);
  });
});

describe('toRuntimeConfig', () => {
  it('serializes routes and fills input defaults', () => {
    expect(
      toRuntimeConfig(
        { component: './s.tsx', routes: ['/chat', /^\/chat\/\d+$/i] },
        'app',
      ),
    ).toEqual({
      id: SHELL_ELEMENT_ID,
      mountId: 'app',
      routes: [{ exact: '/chat' }, { pattern: '^\\/chat\\/\\d+$', flags: 'i' }],
      readySelector: null,
      readyHold: 200,
      timeout: 15000,
      input: {
        shell: '[data-app-shell-input]',
        target: null,
        autofocus: false,
        settle: 3000,
      },
      deferStylesheets: false,
    });
  });

  it('disables input capture with input: false', () => {
    expect(
      toRuntimeConfig({ component: './s.tsx', input: false }, 'root').input,
    ).toBeNull();
  });
});
