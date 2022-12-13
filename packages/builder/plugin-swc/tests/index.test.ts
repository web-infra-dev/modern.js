import * as path from 'path';
import { it, expect, describe } from 'vitest';
import MagicString from 'magic-string';
import { SourceMapConsumer } from 'source-map';

import { transform } from '../src/binding';
import { fsSnapshot, walkLeafDir } from './utils';
import { lookForBrowserslist } from './browserslist';

/*
 * # Workflow
 * If you want to add new test.
 *
 * ## Init:
 * 1. First create a new folder, assuming you add fixtures/polyfill/ie11 folder.
 * 2. Then create your input file, name it 'actual.js', create an option file,
 *    name it option.json, then that's all. write your test like following:
 *
 * ```typescript
 * it('polyfill', async () => {
 *   // find every leaf folder under specific directory
 *   await walkLeafDir(path.resolve(__dirname, 'fixtures/polyfill'), async dir => {
 *      // for every folder, compare expected.js with compiled actual.js
 *      await fsSnapshot(dir, transform)
 *   })
 * })
 * ```
 *
 * Then run ```npm run test```. You will find a new expected.js file in that ie11 folder.
 * You can check if that file is correct.
 *
 * Every time you run test, expected.js will be compared to new generated output so you can
 * treat it as file system snapshot test.
 *
 * ## Update test case:
 * Simply delete old expected.js, then run ```npm run test``` to create a new one.
 */

// Just need to test whether every single option actually works.
// For more detail polyfill test, swc already tested that.
describe('fixtures', () => {
  it('polyfill', async () => {
    await normalFsSnapshot('fixtures/polyfill');
  });

  it('sourcemap', async () => {
    const raw = 'console.log(b);\nconsole.log(a);\n';
    const code = new MagicString(raw, {
      filename: 'begin.js',
    });
    // reverse to 'console.log(a);\nconsole.log(b);\n'
    code.move(0, 'console.log(b);\n'.length - 1, raw.length + 1);
    code.prepend('import { a, b } from "x";\n');

    const inputMap = code.generateMap({
      source: 'begin.js',
      hires: true,
    });

    const { map } = await transform(
      {
        env: {
          targets: 'ie 11',
        },
        module: {
          type: 'commonjs',
        },
        sourceMaps: true,
      },
      '',
      code.toString(),
      JSON.stringify(inputMap),
    );
    /**
      transformed code is:
  "use strict";
  Object.defineProperty(exports, "__esModule", {
     value: true
  });
  var _x = require("x");
  console.log(_x.a);
  console.log(_x.b); ---- line 7
    */
    await SourceMapConsumer.with(map!.toString(), null, smc => {
      // test location for `console.log` at line 7
      // original location is line 1 at `raw`
      const locB = smc.originalPositionFor({
        line: 7,
        column: 13,
      }); // Code position for `_x.b`
      expect(locB.line).equal(1);
      expect(locB.column).equal(12);

      const locA = smc.originalPositionFor({
        line: 6,
        column: 13,
      });
      expect(locA.line).equal(2);
      expect(locA.column).equal(12);
    });
  });

  it('error reporter', async () => {
    try {
      await transform({}, 'anonymous', 'if ((1) const a = 1'); // syntax error
    } catch (e) {
      expect(e as Error).toMatchSnapshot('transform parse error');
    }
  });

  it('look for browserslist', async () => {
    await lookForBrowserslist();
  });

  it('react transform', async () => {
    await normalFsSnapshot('fixtures/react');
  });

  it('typescript', async () => {
    await normalFsSnapshot('fixtures/typescript');
  });

  it('internal_pass', async () => {
    await normalFsSnapshot('fixtures/extensions');
  });

  it('lock_corejs_version', async () => {
    await normalFsSnapshot('fixtures/corejs-version');
  });

  it('compat', async () => {
    await normalFsSnapshot('fixtures/compat');
  });
});

async function normalFsSnapshot(name: string) {
  await walkLeafDir(path.resolve(__dirname, name), async dir => {
    await fsSnapshot(dir, transform);
  });
}
