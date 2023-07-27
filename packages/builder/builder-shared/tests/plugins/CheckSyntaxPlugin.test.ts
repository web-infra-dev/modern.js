import { describe, expect, test } from 'vitest';
import { getHtmlScripts } from '../../src/plugins/CheckSyntaxPlugin/helpers/generateHtmlScripts';

describe('getHtmlScripts', () => {
  test('should extract single inline script correctly', async () => {
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
});
