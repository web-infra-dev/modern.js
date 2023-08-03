import path from 'path';
import assert from 'assert';
import fs from 'fs';
import { Libuilder } from '@modern-js/libuild';

describe('multiply-config', () => {
  it('default', async () => {
    await Libuilder.run({ root: __dirname });
    assert(fs.existsSync(path.resolve(__dirname, 'dist/main.js')), 'chunk should exits in dist/main');
    assert(fs.existsSync(path.resolve(__dirname, 'dist/other.js')), 'entry should exits in dist/other');
  });
});
