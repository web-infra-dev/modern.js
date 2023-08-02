import { describe, expect, test } from 'vitest';
import { getHtmlScripts } from '../../src/plugins/CheckSyntaxPlugin/helpers/generateHtmlScripts';
import { getEcmaVersion } from '../../src/plugins/CheckSyntaxPlugin/helpers/getEcmaVersion';

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
