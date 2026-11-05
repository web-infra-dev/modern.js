import { describe, expect, it } from '@rstest/core';
import {
  DEFAULT_ALLOW_RULES,
  extractCriticalCss,
  rewriteRelativeUrls,
} from '../src/critical-css';

const SHELL =
  '<div id="__modern_app_shell"><nav class="sidebar"><span class="title">Hi</span></nav></div>';

describe('extractCriticalCss', () => {
  it('keeps rules matching shell elements, including pseudo states, and drops the rest', async () => {
    const css = await extractCriticalCss({
      shellHtml: SHELL,
      htmlAttributes: 'data-theme="light"',
      sources: [
        {
          url: '/static/css/main.css',
          css: '.sidebar{width:280px}.sidebar:hover{color:red}.unused{color:blue}.title::after{content:""}',
        },
      ],
      allowRules: DEFAULT_ALLOW_RULES,
    });
    expect(css).toBe(
      '.sidebar{width:280px}.sidebar:hover{color:red}.title::after{content:""}',
    );
  });

  it('keeps theme variables of every theme from initial stylesheets', async () => {
    const css = await extractCriticalCss({
      shellHtml: SHELL,
      htmlAttributes: 'data-theme="light"',
      sources: [
        {
          url: '/static/css/main.css',
          css: ':root{--bg:#fff}[data-theme=dark]{--bg:#000}.other{color:red}',
        },
      ],
      allowRules: DEFAULT_ALLOW_RULES,
    });
    expect(css).toBe(':root{--bg:#fff}[data-theme=dark]{--bg:#000}');
  });

  it('takes only shell-targeting rules from async chunks, after the initial ones', async () => {
    const css = await extractCriticalCss({
      shellHtml: SHELL,
      htmlAttributes: '',
      sources: [
        { url: '/static/css/main.css', css: '.sidebar{width:280px}' },
        {
          url: '/static/css/async/page.css',
          css: ':root{--bg:red}body{margin:1px}.title{font-weight:700}.sidebar{width:280px}',
          async: true,
        },
        {
          url: '/static/css/async/other.css',
          css: '.nope{color:red}',
          async: true,
        },
      ],
      allowRules: DEFAULT_ALLOW_RULES,
    });
    expect(css).toBe('.sidebar{width:280px}.title{font-weight:700}');
  });
});

describe('rewriteRelativeUrls', () => {
  it('resolves relative urls against the stylesheet URL and keeps absolute ones', () => {
    expect(
      rewriteRelativeUrls(
        '.a{background:url(../image/a.png)}.b{background:url("data:image/png;base64,xx")}.c{background:url(/x.png)}',
        '//cdn.test/app/static/css/main.css',
      ),
    ).toBe(
      '.a{background:url(//cdn.test/app/static/image/a.png)}.b{background:url("data:image/png;base64,xx")}.c{background:url(/x.png)}',
    );
    expect(
      rewriteRelativeUrls(
        '.a{background:url(./a.png)}',
        '/static/css/main.css',
      ),
    ).toBe('.a{background:url(/static/css/a.png)}');
  });
});
