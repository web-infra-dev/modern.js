import { getLibuilderTest } from '@/toolkit';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

describe('fixture:css_module', () => {
  it('module', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname),
      input: {
        main: './index.ts',
      },
    });
    await bundler.build();
    const content = await fs.promises.readFile(path.resolve(__dirname, 'dist/main.js'), 'utf-8');
    assert(content.includes(`{ "container": "container_`));
    assert(content.includes(`{ "box": "box_`));
    assert(content.includes(`{ "content": "content_`));
  });
});
