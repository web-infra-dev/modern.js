import assert from 'assert';
import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { describe, expect, it } from 'vitest';
import codecs from '../../src/shared/codecs';

describe('codecs', () => {
  it.each(Object.entries(codecs))(
    'should compress %s',
    async (codecName, codec) => {
      const ext = codecName.match(/[a-z]+/)?.[0];
      // TODO: fix lossy png error
      if (ext === 'png') {
        return;
      }
      assert(ext);
      const filename = path.resolve(__dirname, '../assets', `image.${ext}`);
      const oldBuf = await fs.readFile(filename);
      const newBuf = await codec.handler(oldBuf, {});
      expect(newBuf.length).lessThan(oldBuf.length);
    },
  );
});
