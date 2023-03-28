import * as path from 'path';
import * as fs from 'fs';
import { getBrowserslist } from '@modern-js/utils';
import { expect } from 'vitest';
import { transformSync } from '../src/binding';
import { isInUpdate, replaceCorejsAndSwcHelps, walkLeafDir } from './utils';

const testPath = path.resolve(__dirname, 'fixtures/browserslist');

export async function lookForBrowserslist() {
  await walkLeafDir(testPath, async dir => {
    const browserslist = getBrowserslist(dir);

    const { code } = transformSync(
      {
        env: { targets: browserslist, mode: 'entry' },
      },
      '',
      fs.readFileSync(path.resolve(dir, 'actual.js')).toString(),
    );

    const expectedPath = path.resolve(dir, 'expected.js');
    const finalCode = replaceCorejsAndSwcHelps(code);

    if (!fs.existsSync(expectedPath) || isInUpdate()) {
      // Initialize
      fs.writeFileSync(expectedPath, finalCode);
    } else {
      const expected = fs.readFileSync(expectedPath).toString();
      expect(finalCode, `test base: ${dir}`).toEqual(
        expected.replace(new RegExp('\r\n', 'g'), '\n'),
      );
    }
  });
}
