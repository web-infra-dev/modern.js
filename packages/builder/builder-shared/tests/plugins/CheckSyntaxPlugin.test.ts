import { describe, expect, test } from 'vitest';
import { getHtmlScripts } from '../../src/plugins/CheckSyntaxPlugin/helpers/generateHtmlScripts';
import { getEcmaVersion } from '../../src/plugins/CheckSyntaxPlugin/helpers/getEcmaVersion';
import {
  makeCodeFrame,
  displayCodePointer,
} from '../../src/plugins/CheckSyntaxPlugin/helpers';

describe('getHtmlScripts', () => {
  test('should extract inline scripts correctly', async () => {
    expect(
      getHtmlScripts(`<html>
    <head>
      <title>Title</title>
    </head>
    <body>
      <h1>Hello, World!</h1>
      <script src="external.js"></script>
      <script>
        console.log('Inline script 1');
      </script>
      <script type="text/javascript">
        console.log('Inline script 2');
      </script>
      <script type="application/javascript">
        console.log('Inline script 3');
      </script>
      <script>
        var message = "This is a test script.";
        console.log(message);
        alert("This is an alert.\nIt has a line break.");
      </script>
    </body>
  </html>`),
    ).toMatchInlineSnapshot(`
      [
        "console.log('Inline script 1');",
        "console.log('Inline script 2');",
        "console.log('Inline script 3');",
        "var message = \\"This is a test script.\\";
              console.log(message);
              alert(\\"This is an alert.
      It has a line break.\\");",
      ]
    `);
  });

  test('should not extract external scripts and JSON scripts', async () => {
    expect(
      getHtmlScripts(`<html>
    <head>
      <title>Title</title>
    </head>
    <body>
      <h1>Hello, World!</h1>
      <script type="application/json">{"foo":"bar"}</script>
      <script src="external.js"></script>
    </body>
  </html>`),
    ).toEqual([]);
  });
});

describe('checkIsSupportBrowser', () => {
  test('should get ecma version of single browser correctly', async () => {
    expect(getEcmaVersion(['ie >= 11'])).toEqual(5);
    expect(getEcmaVersion(['Chrome >= 33'])).toEqual(5);
    expect(getEcmaVersion(['Edge >= 12'])).toEqual(5);
    expect(getEcmaVersion(['Edge >= 15'])).toEqual(6);
    expect(getEcmaVersion(['Chrome >= 53'])).toEqual(6);
  });

  test('should get ecma version of multiple browsers correctly', async () => {
    expect(getEcmaVersion(['ie >= 11', 'Chrome >= 53'])).toEqual(5);
    expect(getEcmaVersion(['Edge >= 15', 'Chrome >= 53'])).toEqual(6);
  });
});

describe('makeCodeFrame', () => {
  test('should make code frame correctly', () => {
    const lines = [
      'const a = 1;',
      '',
      'var b = 2;',
      '',
      'console.log(() => {',
      '  return a + b;',
      '});',
      '',
      'var c = 3;',
    ];

    expect(makeCodeFrame(lines, 0)).toMatchInlineSnapshot(`
      "
         > 1 | const a = 1;
           2 | 
           3 | var b = 2;
           4 | "
    `);
    expect(makeCodeFrame(lines, 4)).toMatchInlineSnapshot(`
      "
           2 | 
           3 | var b = 2;
           4 | 
         > 5 | console.log(() => {
           6 |   return a + b;
           7 | });
           8 | "
    `);
  });
});

describe('displayCodePointer', () => {
  test('should display code pointer correctly', () => {
    const code =
      '(self.webpackChunktmp=self.webpackChunktmp||[]).push([[179],{530:()=>{console.log(1);let e=1;e="2"}},e=>{var l;l=530,e(e.s=l)}]);';
    expect(`\n  code:    ${displayCodePointer(code, 66)}`)
      .toMatchInlineSnapshot(`
        "
          code:    =self.webpackChunktmp||[]).push([[179],{530:()=>{console.log(1);let e=1;e=\\"2\\"}},e=>{var l;
                                                               ^"
      `);
  });
});
